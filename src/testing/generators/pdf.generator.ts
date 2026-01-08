/**
 * PDF Generator for testing
 * Generates sample PDFs using mock data
 */

import { Logger } from '@nestjs/common';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TemplateService } from '../../reports/templates/template.service';
import { ReportPdfService } from '../../reports/pdf/report-pdf.service';
import {
  mockReportData,
  mockReportDataExtended,
  mockIndividualReportData,
} from '../mock-data';

/**
 * PDF Generator for testing report generation
 */
export class PdfGenerator {
  private readonly logger = new Logger(PdfGenerator.name);
  private templateService: TemplateService;
  private pdfService: ReportPdfService;
  private outputDir: string;

  constructor() {
    this.templateService = new TemplateService();
    this.pdfService = new ReportPdfService();
    this.outputDir = join(__dirname, '..', 'outputs');
    this.ensureOutputDir();
  }

  /**
   * Ensures output directory exists
   */
  private ensureOutputDir(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
      this.logger.log(`Created output directory: ${this.outputDir}`);
    }
  }

  /**
   * Initializes services
   */
  async initialize(): Promise<void> {
    this.logger.log('Initializing services...');
    this.templateService.onModuleInit();
    await this.pdfService.onModuleInit();
    this.logger.log('✅ Services initialized');
  }

  /**
   * Cleans up resources
   */
  async cleanup(): Promise<void> {
    this.logger.log('Cleaning up resources...');
    await this.pdfService.onModuleDestroy();
    this.logger.log('✅ Cleanup complete');
  }

  /**
   * Generates a standard report with all fields
   */
  async generateStandardReport(): Promise<string> {
    this.logger.log('📊 Generating standard report (all fields)...');

    const html = this.templateService.renderProductivityReport(mockReportData);
    const pdfBuffer = await this.pdfService.generatePdf(html);

    const filename = `standard-report-${Date.now()}.pdf`;
    const filepath = join(this.outputDir, filename);

    writeFileSync(filepath, pdfBuffer);
    this.logger.log(`✅ Standard report generated: ${filepath}`);

    return filepath;
  }

  /**
   * Generates a report with custom fields
   */
  async generateCustomFieldsReport(
    selectedFields: string[],
    suffix?: string,
  ): Promise<string> {
    this.logger.log(
      `📊 Generating custom fields report (${selectedFields.length} fields)...`,
    );

    const html = this.templateService.renderProductivityReport(
      mockReportData,
      selectedFields,
    );
    const pdfBuffer = await this.pdfService.generatePdf(html);

    const fieldsSuffix =
      suffix || selectedFields.join('-').toLowerCase().replace(/_/g, '-');
    const filename = `custom-${fieldsSuffix}-${Date.now()}.pdf`;
    const filepath = join(this.outputDir, filename);

    writeFileSync(filepath, pdfBuffer);
    this.logger.log(`✅ Custom report generated: ${filepath}`);

    return filepath;
  }

  /**
   * Generates an extended report with more data
   */
  async generateExtendedReport(): Promise<string> {
    this.logger.log('📊 Generating extended report (10 contractors)...');

    const html = this.templateService.renderProductivityReport(
      mockReportDataExtended,
    );
    const pdfBuffer = await this.pdfService.generatePdf(html);

    const filename = `extended-report-${Date.now()}.pdf`;
    const filepath = join(this.outputDir, filename);

    writeFileSync(filepath, pdfBuffer);
    this.logger.log(`✅ Extended report generated: ${filepath}`);

    return filepath;
  }

  /**
   * Generates an individual contractor report
   */
  async generateIndividualReport(): Promise<string> {
    this.logger.log('📊 Generating individual contractor report...');

    const html = this.templateService.renderProductivityReport(
      mockIndividualReportData,
    );
    const pdfBuffer = await this.pdfService.generatePdf(html);

    const filename = `individual-report-${Date.now()}.pdf`;
    const filepath = join(this.outputDir, filename);

    writeFileSync(filepath, pdfBuffer);
    this.logger.log(`✅ Individual report generated: ${filepath}`);

    return filepath;
  }

  /**
   * Generates all test reports
   */
  async generateAllReports(): Promise<void> {
    this.logger.log('🚀 Starting test PDF generation...\n');

    const reports: Array<{ name: string; path: string }> = [];

    try {
      // Standard report
      const standardPath = await this.generateStandardReport();
      reports.push({ name: 'Standard Report (All Fields)', path: standardPath });

      // Essential fields report
      const essentialPath = await this.generateCustomFieldsReport(
        ['contractorName', 'timeWorked', 'activityPercentage'],
        'essential',
      );
      reports.push({ name: 'Essential Fields Report', path: essentialPath });

      // Performance report
      const performancePath = await this.generateCustomFieldsReport(
        [
          'contractorName',
          'jobPosition',
          'activityPercentage',
          'productivityScore',
        ],
        'performance',
      );
      reports.push({ name: 'Performance Report', path: performancePath });

      // Location report
      const locationPath = await this.generateCustomFieldsReport(
        ['contractorName', 'country', 'clientName', 'teamName'],
        'location',
      );
      reports.push({ name: 'Location Report', path: locationPath });

      // Extended report
      const extendedPath = await this.generateExtendedReport();
      reports.push({ name: 'Extended Report (10 Users)', path: extendedPath });

      // Individual report
      const individualPath = await this.generateIndividualReport();
      reports.push({ name: 'Individual Report', path: individualPath });

      // Summary
      this.logger.log('\n' + '='.repeat(60));
      this.logger.log('✨ All reports generated successfully!\n');
      this.logger.log('📁 Generated Reports:');
      reports.forEach((report, index) => {
        this.logger.log(`   ${index + 1}. ${report.name}`);
        this.logger.log(`      ${report.path}`);
      });
      this.logger.log('\n' + '='.repeat(60));
    } catch (error) {
      this.logger.error('❌ Error generating reports:', error.message);
      throw error;
    }
  }
}

/**
 * Runs the PDF generator if executed directly
 */
async function main() {
  const generator = new PdfGenerator();

  try {
    await generator.initialize();
    await generator.generateAllReports();
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  } finally {
    await generator.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  void main();
}
