import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { getMessagePattern } from 'config';

import { ReportRequestDto } from './dto/report-request.dto';
import { ReportFromHtmlDto } from './dto/report-from-html.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsListener {
  private readonly logger = new Logger(ReportsListener.name);

  constructor(private readonly reportsService: ReportsService) {}

  @MessagePattern(getMessagePattern('upload.reports.generate'))
  async generateReport(dto: ReportRequestDto) {
    return this.reportsService.generateReport(dto);
  }

  @MessagePattern(getMessagePattern('upload.reports.generateFromHtml'))
  async generateReportFromHtml(dto: ReportFromHtmlDto) {
    return this.reportsService.generateReportFromHtml(dto);
  }
}
