import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { envs, getMessagePattern } from 'config';

import { S3Service, FileType } from '../s3/s3.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { AdtMetricsMapper } from './mappers/adt-metrics.mapper';
import {
  ReportDataBuilder,
  ReportMetadata,
} from './builders/report-data.builder';
import { ReportDateValidator } from './validators/report-date.validator';
import { TemplateService } from './templates/template.service';
import { ReportPdfService } from './pdf/report-pdf.service';

/**
 * Servicio orquestador para generación de reportes
 * Delega responsabilidades a servicios especializados
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject('ADT_SERVICE') private readonly adtClient: ClientProxy,
    private readonly s3Service: S3Service,
    private readonly dateValidator: ReportDateValidator,
    private readonly adtMapper: AdtMetricsMapper,
    private readonly dataBuilder: ReportDataBuilder,
    private readonly templateService: TemplateService,
    private readonly pdfService: ReportPdfService,
  ) {}

  async generateReport(dto: ReportRequestDto) {
    const {
      contractor_id: contractorId,
      useCache = true,
      selectedFields,
      ...filters
    } = dto;

    try {
      // 1. Validar fechas
      const { from, to } = this.dateValidator.validate(filters.from, filters.to);

      // 2. Obtener métricas de ADT
      const rawMetrics = await this.fetchAdtMetrics(
        contractorId,
        from,
        to,
        filters,
        useCache,
      );

      // 3. Mapear datos de ADT
      const adtMetrics = this.adtMapper.mapResponse(rawMetrics);

      // 4. Construir datos del reporte
      const metadata: ReportMetadata = {
        from,
        to,
        contractorId,
        filters: this.extractFilters(filters),
        source: contractorId
          ? 'adt.getRealtimeMetrics'
          : 'adt.getAllRealtimeMetrics',
        environment: envs.environment,
      };
      const reportData = this.dataBuilder.build(adtMetrics, metadata);

      // 5. Generar HTML desde template
      const html = this.templateService.renderProductivityReport(
        reportData,
        selectedFields,
      );

      // 6. Generar PDF
      const pdfBuffer = await this.pdfService.generatePdf(html);

      // 7. Subir a S3
      const key = this.buildS3Key();
      const pdfUrl = await this.s3Service.uploadBuffer(
        pdfBuffer,
        key,
        'application/pdf',
      );

      return {
        success: true,
        pdfUrl,
        metricsCount: reportData.summary.metricsCount,
        generatedAt: new Date().toISOString(),
        environment: envs.environment,
        source: metadata.source,
        summary: reportData.summary,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Obtiene métricas desde el microservicio ADT
   */
  private async fetchAdtMetrics(
    contractorId: string | undefined,
    from: string,
    to: string,
    filters: Partial<ReportRequestDto>,
    useCache: boolean,
  ): Promise<unknown> {
    const adtPayload = {
      from,
      to,
      name: filters.name,
      job_position: filters.job_position,
      country: filters.country,
      client_id: filters.client_id,
      team_id: filters.team_id,
      useCache,
    };

    const pattern = contractorId
      ? 'adt.getRealtimeMetrics'
      : 'adt.getAllRealtimeMetrics';

    const payload = contractorId
      ? { contractorId, ...adtPayload }
      : adtPayload;

    return firstValueFrom(
      this.adtClient.send(getMessagePattern(pattern), payload),
    );
  }

  /**
   * Extrae filtros del DTO
   */
  private extractFilters(
    filters: Partial<ReportRequestDto>,
  ): Record<string, string | number | boolean> {
    const extracted: Record<string, string | number | boolean> = {};

    if (filters.name) extracted.name = filters.name;
    if (filters.job_position) extracted.job_position = filters.job_position;
    if (filters.country) extracted.country = filters.country;
    if (filters.client_id) extracted.client_id = filters.client_id;
    if (filters.team_id) extracted.team_id = filters.team_id;

    return extracted;
  }

  /**
   * Genera key única para S3
   */
  private buildS3Key(): string {
    const datePart = new Date().toISOString().split('T')[0];
    const id = uuidv4();
    return `${FileType.DOCUMENT}/${datePart}/report_${id}.pdf`;
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: unknown): never {
    this.logger.error('Error generating report', error);

    if (error instanceof RpcException) {
      throw error;
    }

    const errorMessage = this.extractErrorMessage(error);
    throw new RpcException(errorMessage);
  }

  /**
   * Extrae mensaje de error de forma segura
   */
  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      if ('response' in error && typeof error.response === 'string') {
        return error.response;
      }
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return 'Failed to generate report';
  }
}
