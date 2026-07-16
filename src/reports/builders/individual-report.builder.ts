import { Injectable } from '@nestjs/common';
import { ReportDataBuilder, ReportMetadata } from './report-data.builder';
import {
  AdtMetricsResponse,
  NormalizedUserActivity,
} from '../interfaces/adt-metrics.interfaces';
import {
  ReportData,
  ReportSummary,
  AppUsage,
  BrowserUsage,
  HourlyChartData,
  ContractorSession,
} from '../interfaces/report.interfaces';

/**
 * Datos extendidos para reporte individual
 */
export interface IndividualReportData extends ReportData {
  contractor: {
    id: string;
    name: string;
    jobPosition: string;
    clientName: string;
    teamName: string;
    country: string;
  };
  metrics: {
    timeWorked: string;
    activityPercentage: number;
    productivityScore: number;
    totalBeats: number;
    activeBeats: number;
    idleBeats: number;
    totalKeyboardInputs: number;
    totalMouseClicks: number;
    avgKeyboardPerMin: number;
    avgMousePerMin: number;
    effectiveWorkSeconds: number;
  };
  performance: {
    isAboveAverageActivity: boolean;
    isAboveAverageProductivity: boolean;
    activityRank?: string; // "Top 10%", "Above Average", etc.
    productivityRank?: string;
  };
  insights: {
    mostProductiveDay?: string;
    leastProductiveDay?: string;
    averageDailyHours?: string;
    consistencyScore?: number; // 0-100
  };
  // Datos adicionales para el reporte individual
  topApps?: AppUsage[];
  topWebsites?: BrowserUsage[];
  hourlyData?: HourlyChartData[];
  sessions?: ContractorSession[];
  sessionsByDay?: Array<{ session_day: string; sessions: ContractorSession[] }>;
  sessionConnectivity?: {
    sessionCount: number;
    avgDurationSeconds: number;
    avgProductivity: number;
    avgDurationLabel: string;
    avgProductivityLabel: string;
  };
  usageDistribution?: Array<{ type: string; percentage: number; color: string }>;
}

/**
 * Builder especializado para reportes individuales (single contractor)
 * Proporciona análisis detallado y comparaciones con promedios
 */
@Injectable()
export class IndividualReportBuilder extends ReportDataBuilder {
  /**
   * Construye un reporte individual con métricas extendidas
   */
  buildIndividualReport(
    adtMetrics: AdtMetricsResponse,
    metadata: ReportMetadata,
    rawMetrics?: unknown,
  ): IndividualReportData {
    const baseReport = this.build(adtMetrics, metadata);

    if (baseReport.items.length === 0) {
      throw new Error('No data found for the specified contractor');
    }

    // En un reporte individual, solo debe haber un item
    const contractorData = baseReport.items[0];
    const summary = baseReport.summary;

    // Preferir payload crudo de ADT (tiene app_usage); fallback al normalizado
    const appsSource = this.resolveAppsSource(adtMetrics, rawMetrics);

    return {
      ...baseReport,
      contractor: this.extractContractorInfo(contractorData),
      metrics: this.extractDetailedMetrics(contractorData, adtMetrics),
      performance: this.buildPerformanceAnalysis(
        contractorData,
        summary,
        adtMetrics,
      ),
      insights: this.buildInsights(contractorData, metadata),
      // Datos adicionales para gráficos y visualizaciones
      topApps: this.extractTopApps(appsSource),
      topWebsites: this.extractTopWebsites(appsSource),
      usageDistribution: this.buildUsageDistribution(appsSource),
      // hourlyData, sessions y sessionsByDay se agregarán desde el servicio de reportes
      // ya que requieren llamadas adicionales a ADT_MS
    };
  }

  /**
   * Resuelve la fuente de apps/browser: payload crudo ADT o item normalizado.
   */
  private resolveAppsSource(
    adtMetrics: AdtMetricsResponse,
    rawMetrics?: unknown,
  ): any {
    if (rawMetrics && typeof rawMetrics === 'object') {
      if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
        return rawMetrics[0];
      }
      const raw = rawMetrics as Record<string, unknown>;
      if (Array.isArray(raw.items) && raw.items.length > 0) {
        return raw.items[0];
      }
      if (Array.isArray(raw.app_usage) || Array.isArray(raw.browser_usage)) {
        return raw;
      }
      if (raw.consolidated && typeof raw.consolidated === 'object') {
        return raw.consolidated;
      }
    }

    const normalized = adtMetrics.items[0] as any;
    return {
      app_usage: normalized?.appUsage || normalized?.app_usage || [],
      browser_usage: normalized?.browserUsage || normalized?.browser_usage || [],
    };
  }

  /**
   * Extrae información básica del contractor
   */
  private extractContractorInfo(data: NormalizedUserActivity) {
    return {
      id: data.contractorId,
      name: data.contractorName,
      jobPosition: data.jobPosition || 'N/A',
      clientName: data.clientName || 'N/A',
      teamName: data.teamName || 'N/A',
      country: data.country || 'N/A',
    };
  }

  /**
   * Extrae métricas detalladas del contractor
   */
  private extractDetailedMetrics(
    data: NormalizedUserActivity,
    adtMetrics: AdtMetricsResponse,
  ) {
    // Buscar datos extendidos en el array original de ADT
    const rawItem = adtMetrics.items[0] as any;

    return {
      timeWorked: data.timeWorked || '00:00:00',
      activityPercentage: data.activityPercentage || 0,
      productivityScore: data.productivityScore || 0,
      totalBeats: rawItem?.totalBeats || rawItem?.total_beats || 0,
      activeBeats: rawItem?.activeBeats || rawItem?.active_beats || 0,
      idleBeats: rawItem?.idleBeats || rawItem?.idle_beats || 0,
      totalKeyboardInputs:
        rawItem?.totalKeyboardInputs || rawItem?.total_keyboard_inputs || 0,
      totalMouseClicks:
        rawItem?.totalMouseClicks || rawItem?.total_mouse_clicks || 0,
      avgKeyboardPerMin:
        rawItem?.avgKeyboardPerMin || rawItem?.avg_keyboard_per_min || 0,
      avgMousePerMin:
        rawItem?.avgMousePerMin || rawItem?.avg_mouse_per_min || 0,
      effectiveWorkSeconds:
        rawItem?.effectiveWorkSeconds || rawItem?.effective_work_seconds || 0,
    };
  }

  /**
   * Construye análisis de rendimiento comparado con promedios
   */
  private buildPerformanceAnalysis(
    contractorData: NormalizedUserActivity,
    summary: ReportSummary,
    adtMetrics: AdtMetricsResponse,
  ) {
    const avgActivity = summary.averageActivity || 0;
    const avgProductivity = summary.averageProductivity || 0;

    const isAboveAverageActivity =
      contractorData.activityPercentage > avgActivity;
    const isAboveAverageProductivity =
      contractorData.productivityScore > avgProductivity;

    return {
      isAboveAverageActivity,
      isAboveAverageProductivity,
      activityRank: this.calculateRank(
        contractorData.activityPercentage,
        avgActivity,
      ),
      productivityRank: this.calculateRank(
        contractorData.productivityScore,
        avgProductivity,
      ),
    };
  }

  /**
   * Calcula el ranking descriptivo basado en desviación del promedio
   */
  private calculateRank(value: number, average: number): string {
    const deviation = ((value - average) / average) * 100;

    if (deviation >= 30) return 'Top 10% - Exceptional';
    if (deviation >= 15) return 'Top 25% - Excellent';
    if (deviation >= 5) return 'Above Average';
    if (deviation >= -5) return 'Average';
    if (deviation >= -15) return 'Below Average';
    return 'Needs Improvement';
  }

  /**
   * Construye insights adicionales del período
   */
  private buildInsights(
    contractorData: NormalizedUserActivity,
    metadata: ReportMetadata,
  ) {
    // Calcular días del período
    const fromDate = new Date(metadata.from);
    const toDate = new Date(metadata.to);
    const daysDiff =
      Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Convertir timeWorked "HH:MM:SS" a segundos
    const [hours, minutes, seconds] = (contractorData.timeWorked || '00:00:00')
      .split(':')
      .map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const totalHours = totalSeconds / 3600;

    // Promedio de horas diarias
    const avgDailyHours = totalHours / daysDiff;
    const avgHours = Math.floor(avgDailyHours);
    const avgMinutes = Math.round((avgDailyHours - avgHours) * 60);
    const averageDailyHours = `${avgHours}:${avgMinutes.toString().padStart(2, '0')}`;

    // Consistencia (básica: si trabaja cerca de 8h diarias)
    const consistencyScore = Math.min(100, Math.round((avgDailyHours / 8) * 100));

    return {
      mostProductiveDay: undefined, // Requiere métricas diarias
      leastProductiveDay: undefined, // Requiere métricas diarias
      averageDailyHours,
      consistencyScore,
    };
  }

  /**
   * Extrae top aplicaciones del raw response
   */
  private extractTopApps(rawItem: any): AppUsage[] {
    const appUsage = rawItem?.app_usage || [];
    
    if (!Array.isArray(appUsage) || appUsage.length === 0) {
      return [];
    }

    // Calcular total para porcentajes
    const totalSeconds = appUsage.reduce((sum, app) => sum + (app.seconds || 0), 0);

    // Mapear y ordenar por tiempo de uso
    return appUsage
      .map((app) => ({
        appName: app.appName || app.app_name || 'Unknown',
        seconds: app.seconds || 0,
        type: app.type || undefined,
        category: app.category ?? null,
        percentage: totalSeconds > 0 ? Math.round((app.seconds / totalSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10); // Top 10
  }

  /**
   * Extrae top websites del raw response
   */
  private extractTopWebsites(rawItem: any): BrowserUsage[] {
    const browserUsage = rawItem?.browser_usage || [];
    
    if (!Array.isArray(browserUsage) || browserUsage.length === 0) {
      return [];
    }

    // Calcular total para porcentajes
    const totalSeconds = browserUsage.reduce((sum, site) => sum + (site.seconds || 0), 0);

    // Mapear y ordenar por tiempo de uso
    return browserUsage
      .map((site) => ({
        domain: site.domain || 'Unknown',
        seconds: site.seconds || 0,
        percentage: totalSeconds > 0 ? Math.round((site.seconds / totalSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10); // Top 10
  }

  /**
   * Construye distribución de uso por tipo de aplicación
   */
  private buildUsageDistribution(rawItem: any) {
    const appUsage = rawItem?.app_usage || [];
    
    if (!Array.isArray(appUsage) || appUsage.length === 0) {
      return [];
    }

    // Colores para tipos de app (igual que el frontend)
    const APP_TYPE_COLORS: Record<string, string> = {
      Code: '#0097B2',
      Web: '#7DA40A',
      Design: '#FF1493',
      Chat: '#9966FF',
      Office: '#FF9F40',
      Productivity: '#FF6384',
      Development: '#9966FF',
      Database: '#36A2EB',
      Cloud: '#C9CBCF',
      Entertainment: '#E74C3C',
      System: '#95A5A6',
      Other: '#BDC3C7',
    };

    // Agrupar por tipo
    const byType: Record<string, number> = {};
    let totalSeconds = 0;

    appUsage.forEach((app) => {
      const type = app.type || 'Other';
      byType[type] = (byType[type] || 0) + (app.seconds || 0);
      totalSeconds += app.seconds || 0;
    });

    // Convertir a array con porcentajes
    return Object.entries(byType)
      .filter(([_, seconds]) => seconds > 0)
      .map(([type, seconds]) => ({
        type,
        percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
        color: APP_TYPE_COLORS[type] || APP_TYPE_COLORS.Other,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }
}
