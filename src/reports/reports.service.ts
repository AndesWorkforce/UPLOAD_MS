import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { envs, getMessagePattern } from 'config';

import { S3Service, FileType } from '../s3/s3.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { ReportFromHtmlDto } from './dto/report-from-html.dto';
import { AdtMetricsMapper } from './mappers/adt-metrics.mapper';
import {
  ReportDataBuilder,
  ReportMetadata,
} from './builders/report-data.builder';
import { IndividualReportBuilder } from './builders/individual-report.builder';
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
    private readonly individualBuilder: IndividualReportBuilder,
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

      // Detectar si es reporte individual o grupal
      if (contractorId) {
        return await this.generateIndividualReport(
          contractorId,
          from,
          to,
          filters,
          useCache,
        );
      } else {
        return await this.generateGroupReport(
          from,
          to,
          filters,
          useCache,
          selectedFields,
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Genera reporte individual para un contractor específico
   */
  private async generateIndividualReport(
    contractorId: string,
    from: string,
    to: string,
    filters: Partial<ReportRequestDto>,
    useCache: boolean,
  ) {
    // 1. Obtener todos los datos necesarios en paralelo
    const [rawMetrics, hourlyDurationData, hourlyProductivityData, sessionsData] =
      await Promise.all([
        this.fetchAdtMetrics(contractorId, from, to, filters, useCache),
        this.fetchHourlySessionDuration(contractorId, from, to),
        this.fetchHourlyProductivity(contractorId, from, to),
        this.fetchContractorSessionsByDay(contractorId, from, to),
      ]);

    // 2. Mapear datos de ADT
    const adtMetrics = this.adtMapper.mapResponse(rawMetrics);

    // 3. Construir datos del reporte individual
    const metadata: ReportMetadata = {
      from,
      to,
      contractorId,
      filters: this.extractFilters(filters),
      source: 'adt.getRealtimeMetrics',
      environment: envs.environment,
    };

    const reportData = this.individualBuilder.buildIndividualReport(
      adtMetrics,
      metadata,
    );

    // 4. Agregar datos adicionales
    reportData.hourlyData = hourlyDurationData.map((h: any) => ({
      hour: h.hour_label,
      duration: Math.round((h.avg_duration_seconds / 3600) * 100) / 100,
      productivity: 0, // Se agregará con hourlyProductivityData
    }));

    // Combinar con productividad
    hourlyProductivityData.forEach((hp: any) => {
      const hourData = reportData.hourlyData?.find((h) => h.hour === hp.hour_label);
      if (hourData) {
        hourData.productivity = Math.round(hp.avg_productivity_score);
      }
    });

    reportData.sessionsByDay = sessionsData;

    // 5. Generar HTML desde template individual
    const html = this.templateService.renderIndividualReport(reportData);

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
      metricsCount: 1,
      generatedAt: new Date().toISOString(),
      environment: envs.environment,
      source: metadata.source,
      summary: reportData.summary,
    };
  }

  /**
   * Genera reporte grupal
   */
  private async generateGroupReport(
    from: string,
    to: string,
    filters: Partial<ReportRequestDto>,
    useCache: boolean,
    selectedFields?: string[],
  ) {
    // 2. Obtener métricas de ADT
    const rawMetrics = await this.fetchAdtMetrics(
      undefined,
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
      contractorId: undefined,
      filters: this.extractFilters(filters),
      source: 'adt.getAllRealtimeMetrics',
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
  }

  /**
   * Genera reporte PDF desde HTML renderizado en el frontend
   * El frontend envía el HTML completo con datos y estilos
   * Se convierte a PDF y se sube a S3
   */
  async generateReportFromHtml(dto: ReportFromHtmlDto) {
    const { html, fileName } = dto;

    try {
      this.logger.log('Generating PDF from frontend HTML...');

      // 1. Generar PDF desde HTML recibido
      const pdfBuffer = await this.pdfService.generatePdf(html);

      // 2. Subir a S3
      const key = this.buildS3Key(fileName);
      const pdfUrl = await this.s3Service.uploadBuffer(
        pdfBuffer,
        key,
        'application/pdf',
      );

      this.logger.log(`PDF generated from HTML and uploaded: ${key}`);

      return {
        success: true,
        pdfUrl,
        generatedAt: new Date().toISOString(),
        environment: envs.environment,
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
   * Obtiene datos de duración de sesiones por hora
   */
  private async fetchHourlySessionDuration(
    contractorId: string,
    from: string,
    to: string,
  ): Promise<any[]> {
    try {
      const payload = {
        contractorId,
        startDate: from,
        endDate: to,
        limit: 30,
        startHour: 8,
        endHour: 17,
      };

      return firstValueFrom(
        this.adtClient.send(
          getMessagePattern('adt.getHourlySessionDuration'),
          payload,
        ),
      );
    } catch (error) {
      this.logger.error('Error fetching hourly session duration', error);
      return [];
    }
  }

  /**
   * Obtiene datos de productividad por hora
   */
  private async fetchHourlyProductivity(
    contractorId: string,
    from: string,
    to: string,
  ): Promise<any[]> {
    try {
      const payload = {
        contractorId,
        startDate: from,
        endDate: to,
        limit: 30,
        startHour: 8,
        endHour: 18,
      };

      return firstValueFrom(
        this.adtClient.send(
          getMessagePattern('adt.getHourlyProductivity'),
          payload,
        ),
      );
    } catch (error) {
      this.logger.error('Error fetching hourly productivity', error);
      return [];
    }
  }

  /**
   * Obtiene sesiones del contractor agrupadas por día
   */
  private async fetchContractorSessionsByDay(
    contractorId: string,
    from: string,
    to: string,
  ): Promise<any[]> {
    try {
      const payload = {
        contractorId,
        startDate: from,
        endDate: to,
      };

      return firstValueFrom(
        this.adtClient.send(
          getMessagePattern('adt.getSessionSummariesByDay'),
          payload,
        ),
      );
    } catch (error) {
      this.logger.error('Error fetching contractor sessions by day', error);
      return [];
    }
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
  private buildS3Key(fileName?: string): string {
    const datePart = new Date().toISOString().split('T')[0];
    const id = uuidv4();
    const name = fileName
      ? fileName.replace(/[^a-zA-Z0-9-_]/g, '_')
      : `report_${id}`;
    return `${FileType.DOCUMENT}/${datePart}/${name}.pdf`;
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
