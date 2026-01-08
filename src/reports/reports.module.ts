import { Module } from '@nestjs/common';

import { ReportsListener } from './reports.listener';
import { ReportsService } from './reports.service';
import { S3Module } from '../s3/s3.module';
import { ReportDateValidator } from './validators/report-date.validator';
import { AdtMetricsMapper } from './mappers/adt-metrics.mapper';
import { ReportDataBuilder } from './builders/report-data.builder';
import { TemplateService } from './templates/template.service';
import { ReportPdfService } from './pdf/report-pdf.service';

@Module({
  imports: [S3Module],
  controllers: [ReportsListener],
  providers: [
    ReportsService,
    ReportDateValidator,
    AdtMetricsMapper,
    ReportDataBuilder,
    TemplateService,
    ReportPdfService,
  ],
})
export class ReportsModule {}
