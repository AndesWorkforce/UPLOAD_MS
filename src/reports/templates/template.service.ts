import { Injectable, OnModuleInit } from '@nestjs/common';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ReportData } from '../interfaces/report.interfaces';

/**
 * Servicio para compilar templates de Handlebars
 */
@Injectable()
export class TemplateService implements OnModuleInit {
  private productivityTemplate!: handlebars.TemplateDelegate;

  onModuleInit() {
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Renderiza el reporte de productividad
   * @param data Datos del reporte
   * @param selectedFields Campos a mostrar (opcional, por defecto todos)
   */
  renderProductivityReport(
    data: ReportData,
    selectedFields?: string[],
  ): string {
    const templateData = this.prepareTemplateData(data, selectedFields);
    return this.productivityTemplate(templateData);
  }

  /**
   * Registra helpers de Handlebars
   */
  private registerHelpers(): void {
    // Helper para formatear números con separadores de miles
    handlebars.registerHelper('formatNumber', (value: number) => {
      if (typeof value !== 'number') return value;
      return value.toLocaleString('en-US');
    });

    // Helper para determinar clase CSS de actividad
    handlebars.registerHelper('activityClass', (percentage: number) => {
      return percentage >= 50 ? 'activity-high' : 'activity-low';
    });
  }

  /**
   * Carga templates desde archivos
   */
  private loadTemplates(): void {
    // En desarrollo, leer desde src; en producción desde dist
    const isDevelopment = process.env.NODE_ENV !== 'production';
    let templatePath: string;

    if (isDevelopment) {
      // En desarrollo: leer desde src/reports/templates/
      templatePath = join(
        process.cwd(),
        'src',
        'reports',
        'templates',
        'productivity-report.hbs',
      );
    } else {
      // En producción: leer desde dist/src/reports/templates/
      templatePath = join(
        __dirname,
        '..',
        'templates',
        'productivity-report.hbs',
      );
    }

    const templateContent = readFileSync(templatePath, 'utf-8');
    this.productivityTemplate = handlebars.compile(templateContent);
  }

  /**
   * Prepara datos para el template
   */
  private prepareTemplateData(
    data: ReportData,
    selectedFields?: string[],
  ): Record<string, unknown> {
    const { summary, items } = data;

    // Si no se especifican campos, mostrar todos
    const fieldsToShow = selectedFields || [
      'contractorName',
      'jobPosition',
      'clientName',
      'teamName',
      'country',
      'timeWorked',
      'activityPercentage',
      'productivityScore',
    ];

    // Crear flags de visibilidad para cada campo
    const fieldVisibility = this.createFieldVisibilityFlags(fieldsToShow);

    return {
      summary,
      items,
      periodStart: new Date(summary.from).toLocaleDateString(),
      periodEnd: new Date(summary.to).toLocaleDateString(),
      generatedAt: new Date().toLocaleString(),
      hasFilters: Object.keys(summary.filters).length > 0,
      filters: summary.filters,
      hasPerformers:
        summary.mostActiveUser !== undefined &&
        summary.leastActiveUser !== undefined,
      ...fieldVisibility, // Expandir flags de visibilidad
    };
  }

  /**
   * Crea flags booleanos para visibilidad de campos
   * @param selectedFields Array de campos a mostrar
   * @returns Objeto con flags showField_xxx
   */
  private createFieldVisibilityFlags(
    selectedFields: string[],
  ): Record<string, boolean> {
    const allFields = [
      'contractorName',
      'jobPosition',
      'clientName',
      'teamName',
      'country',
      'timeWorked',
      'activityPercentage',
      'productivityScore',
    ];

    const flags: Record<string, boolean> = {};
    allFields.forEach((field) => {
      flags[`showField_${field}`] = selectedFields.includes(field);
    });

    return flags;
  }
}
