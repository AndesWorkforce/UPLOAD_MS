import { Injectable, OnModuleInit } from '@nestjs/common';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ReportData } from '../interfaces/report.interfaces';
import { IndividualReportData } from '../builders/individual-report.builder';

/**
 * Servicio para compilar templates de Handlebars
 */
@Injectable()
export class TemplateService implements OnModuleInit {
  private productivityTemplate!: handlebars.TemplateDelegate;
  private individualProductivityTemplate!: handlebars.TemplateDelegate;

  onModuleInit() {
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Renderiza el reporte de productividad grupal
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
   * Renderiza el reporte de productividad individual
   * @param data Datos del reporte individual
   */
  renderIndividualReport(data: IndividualReportData): string {
    const templateData = this.prepareIndividualTemplateData(data);
    return this.individualProductivityTemplate(templateData);
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

    // Helper para formatear porcentajes (redondear a 2 decimales)
    handlebars.registerHelper('formatPercentage', (value: number) => {
      if (typeof value !== 'number') return value;
      return Math.round(value * 100) / 100;
    });

    // Helper para formatear segundos a tiempo HH:MM
    handlebars.registerHelper('formatSecondsToTime', (seconds: number) => {
      if (typeof seconds !== 'number') return '0h 00m';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    });

    // Helper para determinar clase CSS de actividad
    handlebars.registerHelper('activityClass', (percentage: number) => {
      return percentage >= 50 ? 'activity-high' : 'activity-low';
    });

    // Helper para determinar clase CSS de productividad
    handlebars.registerHelper('productivityClass', (score: number) => {
      if (score >= 65) return 'productivity-high';
      if (score >= 40) return 'productivity-medium';
      return 'productivity-low';
    });
  }

  /**
   * Carga templates desde archivos
   */
  private loadTemplates(): void {
    // En desarrollo, leer desde src; en producción desde dist
    const isDevelopment = process.env.NODE_ENV !== 'production';
    let templatePath: string;
    let individualTemplatePath: string;

    if (isDevelopment) {
      // En desarrollo: leer desde src/reports/templates/
      templatePath = join(
        process.cwd(),
        'src',
        'reports',
        'templates',
        'productivity-report.hbs',
      );
      individualTemplatePath = join(
        process.cwd(),
        'src',
        'reports',
        'templates',
        'individual-productivity-report.hbs',
      );
    } else {
      // En producción: leer desde dist/src/reports/templates/
      templatePath = join(
        __dirname,
        '..',
        'templates',
        'productivity-report.hbs',
      );
      individualTemplatePath = join(
        __dirname,
        '..',
        'templates',
        'individual-productivity-report.hbs',
      );
    }

    const templateContent = readFileSync(templatePath, 'utf-8');
    this.productivityTemplate = handlebars.compile(templateContent);

    const individualTemplateContent = readFileSync(individualTemplatePath, 'utf-8');
    this.individualProductivityTemplate = handlebars.compile(individualTemplateContent);
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

    // Calcular promedios correctamente desde los items individuales
    const totalContractors = items.length || 1; // Evitar división por cero

    // Promedio de tiempo activo (effective_work_seconds)
    const totalActiveSeconds = items.reduce((sum, item) => {
      return sum + (item.effectiveWorkSeconds || 0);
    }, 0);
    const avgActiveSeconds = totalActiveSeconds / totalContractors;

    // Promedio de tiempo total de sesión
    const totalSessionSeconds = items.reduce((sum, item) => {
      return sum + (item.totalSessionSeconds || 0);
    }, 0);
    const avgDurationSeconds = totalSessionSeconds / totalContractors;

    // Promedio de tiempo inactivo (idle = total - active)
    const avgIdleSeconds = avgDurationSeconds - avgActiveSeconds;

    // Extraer client name y team name de items
    const clientName =
      items.length > 0 ? items[0].clientName || 'N/A' : 'N/A';
    const teamName = items.length > 0 ? items[0].teamName || 'N/A' : 'N/A';

    // Formatear average active para cada item (opcional, para uso en tabla)
    const enhancedItems = items.map((item) => ({
      ...item,
      avgActive: this.formatSecondsToTime(item.effectiveWorkSeconds || 0),
      // Redondear porcentajes a 2 decimales
      activityPercentage: Math.round(item.activityPercentage * 100) / 100,
      productivityScore: Math.round(item.productivityScore * 100) / 100,
    }));

    // Agrupar items por cliente y equipo (como en el frontend)
    const groupedData = this.groupItemsByClientAndTeam(enhancedItems);

    // Formatear filtros aplicados de manera legible
    const formattedFilters = this.formatFilters(summary, clientName, teamName);

    return {
      summary: {
        ...summary,
        // Redondear porcentajes a 2 decimales
        averageActivity: Math.round(summary.averageActivity * 100) / 100,
        averageProductivity: Math.round(summary.averageProductivity * 100) / 100,
        mostActiveUser: summary.mostActiveUser ? {
          name: summary.mostActiveUser.name,
          activityPercentage: Math.round(summary.mostActiveUser.activityPercentage * 100) / 100,
        } : undefined,
        leastActiveUser: summary.leastActiveUser ? {
          name: summary.leastActiveUser.name,
          activityPercentage: Math.round(summary.leastActiveUser.activityPercentage * 100) / 100,
        } : undefined,
      },
      items: enhancedItems,
      groupedData, // Datos agrupados por cliente/equipo con summaries
      periodStart: new Date(summary.from).toLocaleDateString(),
      periodEnd: new Date(summary.to).toLocaleDateString(),
      generatedAt: new Date().toLocaleString(),
      hasFilters: formattedFilters.length > 0,
      filters: formattedFilters,
      hasPerformers:
        summary.mostActiveUser !== undefined &&
        summary.leastActiveUser !== undefined,
      avgDuration: this.formatSecondsToTime(avgDurationSeconds),
      avgActiveTime: this.formatSecondsToTime(avgActiveSeconds),
      avgIdleTime: this.formatSecondsToTime(avgIdleSeconds),
      clientName,
      teamName,
      // Chart data
      hasChartData: !!data.chartData && data.chartData.length > 0,
      chartData: data.chartData || [],
      chartLabels: JSON.stringify((data.chartData || []).map(d => d.label)),
      chartValues: JSON.stringify((data.chartData || []).map(d => d.duration)),
      ...fieldVisibility, // Expandir flags de visibilidad
    };
  }

  /**
   * Formatea segundos a formato HH:MM
   */
  private formatSecondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  /**
   * Formatea los filtros aplicados de manera legible
   */
  private formatFilters(
    summary: any,
    clientName: string,
    teamName: string,
  ): Array<{ label: string; value: string }> {
    const formattedFilters: Array<{ label: string; value: string }> = [];

    // Siempre agregar el período
    const periodStart = new Date(summary.from).toLocaleDateString();
    const periodEnd = new Date(summary.to).toLocaleDateString();
    formattedFilters.push({
      label: 'Period',
      value: `${periodStart} - ${periodEnd}`,
    });

    // Mapear filtros con nombres legibles
    const filters = summary.filters || {};

    // Client
    if (filters.client_id && clientName !== 'N/A') {
      formattedFilters.push({
        label: 'Client',
        value: clientName,
      });
    }

    // Team
    if (filters.team_id && teamName !== 'N/A') {
      formattedFilters.push({
        label: 'Team',
        value: teamName,
      });
    }

    // Country
    if (filters.country) {
      formattedFilters.push({
        label: 'Country',
        value: filters.country as string,
      });
    }

    // Job Position
    if (filters.job_position) {
      formattedFilters.push({
        label: 'Job Position',
        value: filters.job_position as string,
      });
    }

    // Contractor Name
    if (filters.name) {
      formattedFilters.push({
        label: 'Contractor',
        value: filters.name as string,
      });
    }

    return formattedFilters;
  }

  /**
   * Agrupa items por cliente y equipo, calculando summaries para cada grupo
   * Similar a la lógica del frontend en GroupReportsView
   */
  private groupItemsByClientAndTeam(items: any[]) {
    // Mapear items por clientId-teamId
    const groupsMap = new Map<string, any[]>();

    items.forEach((item) => {
      const key = `${item.clientId || 'unknown'}-${item.teamId || 'unknown'}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(item);
    });

    // Convertir a array con summaries calculados
    return Array.from(groupsMap.entries()).map(([key, contractors]) => {
      const clientName = contractors[0]?.clientName || 'Unknown';
      const teamName = contractors[0]?.teamName || 'Unknown';

      // Calcular summary del grupo
      const totalSeconds = contractors.reduce(
        (acc, c) => acc + (c.totalSessionSeconds || 0),
        0,
      );
      const avgSeconds = totalSeconds / contractors.length;

      const totalProductivity = contractors.reduce(
        (acc, c) => acc + (c.productivityScore || 0),
        0,
      );
      const avgProductivity = Math.round(totalProductivity / contractors.length);

      return {
        clientName,
        teamName,
        contractors,
        summary: {
          totalContractors: contractors.length,
          avgDuration: this.formatSecondsToTime(avgSeconds),
          avgProductivity: avgProductivity,
        },
      };
    });
  }

  /**
   * Prepara datos para el template individual
   */
  private prepareIndividualTemplateData(data: IndividualReportData): Record<string, unknown> {
    const { summary, contractor, metrics, topApps, topWebsites, hourlyData, sessions, sessionsByDay, usageDistribution } = data;

    // Calcular tiempos desde metrics (igual que el frontend)
    // Tiempo total: totalBeats * 15 (cada beat = 15 segundos)
    const totalSessionSeconds = metrics.totalBeats * 15;
    // Tiempo activo: effectiveWorkSeconds directamente
    const avgActiveSeconds = metrics.effectiveWorkSeconds || 0;
    // Tiempo inactivo: diferencia entre total y activo
    const avgIdleSeconds = totalSessionSeconds - avgActiveSeconds;

    // Preparar datos de charts
    const hasChartData = hourlyData && hourlyData.length > 0;
    const chartLabels = hasChartData ? hourlyData.map(h => h.hour) : [];
    const durationChartValues = hasChartData ? hourlyData.map(h => h.duration) : [];
    const productivityChartValues = hasChartData ? hourlyData.map(h => h.productivity) : [];

    return {
      summary: {
        ...summary,
        averageActivity: Math.round(metrics.activityPercentage * 100) / 100,
        averageProductivity: Math.round(metrics.productivityScore * 100) / 100,
      },
      contractor: {
        name: contractor.name,
        jobPosition: contractor.jobPosition,
        clientName: contractor.clientName,
        teamName: contractor.teamName,
        country: contractor.country,
      },
      metrics: {
        ...metrics,
        activityPercentage: Math.round(metrics.activityPercentage * 100) / 100,
        productivityScore: Math.round(metrics.productivityScore * 100) / 100,
      },
      periodStart: new Date(summary.from).toLocaleDateString(),
      periodEnd: new Date(summary.to).toLocaleDateString(),
      generatedAt: new Date().toLocaleString(),
      avgDuration: this.formatSecondsToTime(totalSessionSeconds),
      avgActiveTime: this.formatSecondsToTime(avgActiveSeconds),
      avgIdleTime: this.formatSecondsToTime(avgIdleSeconds),
      // Top Apps
      topApps: topApps || [],
      // Top Websites
      topWebsites: topWebsites || [],
      // Usage Distribution
      usageDistribution: usageDistribution || [],
      // Chart data
      hasChartData,
      hasDurationData: hasChartData,
      hasProductivityData: hasChartData,
      chartLabels: JSON.stringify(chartLabels),
      durationChartValues: JSON.stringify(durationChartValues),
      productivityChartValues: JSON.stringify(productivityChartValues),
      // Sessions
      sessions: sessions || [],
      sessionsByDay: this.formatSessionsByDay(sessionsByDay || []),
    };
  }

  /**
   * Formatea sesiones agrupadas por día para el template
   */
  private formatSessionsByDay(sessionsByDay: any[]): any[] {
    return sessionsByDay.map((dayGroup) => {
      // Formatear fecha del día a formato legible (e.g., "February 9, 2026")
      const dayDate = new Date(dayGroup.session_day + 'T12:00:00');
      const formattedDay = dayDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Formatear cada sesión
      const formattedSessions = dayGroup.sessions.map((session: any, index: number) => {
        // Extraer solo la hora de los timestamps
        const startTime = this.extractTime(session.session_start);
        const endTime = this.extractTime(session.session_end);

        // Redondear productividad a entero
        const productivity = Math.round(session.productivity_score);

        return {
          index: index + 1,
          session_start: startTime,
          session_end: endTime,
          total_seconds: session.total_seconds,
          active_seconds: session.active_seconds,
          idle_seconds: session.idle_seconds,
          productivity_score: productivity,
        };
      });

      return {
        session_day: formattedDay,
        sessions: formattedSessions,
      };
    });
  }

  /**
   * Extrae solo la hora de un timestamp (formato HH:MM)
   */
  private extractTime(timestamp: string): string {
    if (!timestamp) return '';
    
    // Si ya es solo hora (HH:MM o HH:MM:SS), retornar solo HH:MM
    if (timestamp.length <= 8) {
      return timestamp.substring(0, 5);
    }

    // Si es timestamp completo (YYYY-MM-DD HH:MM:SS)
    const parts = timestamp.split(' ');
    if (parts.length >= 2) {
      return parts[1].substring(0, 5); // Retorna HH:MM
    }

    return timestamp;
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
