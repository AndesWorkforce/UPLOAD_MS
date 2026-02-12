import { Injectable } from '@nestjs/common';
import { ReportDataBuilder, ReportMetadata } from './report-data.builder';
import {
  AdtMetricsResponse,
  NormalizedUserActivity,
} from '../interfaces/adt-metrics.interfaces';
import { ReportData, ReportSummary } from '../interfaces/report.interfaces';

/**
 * Contractor rankeado para reporte grupal
 */
export interface RankedContractor extends NormalizedUserActivity {
  rank: number;
  performanceLabel: string; // "Top Performer", "Above Average", etc.
  activityDelta: number; // Diferencia con el promedio
  productivityDelta: number;
}

/**
 * Estadísticas de distribución del grupo
 */
export interface GroupDistribution {
  activityDistribution: {
    high: number; // > 80%
    medium: number; // 50-80%
    low: number; // < 50%
  };
  productivityDistribution: {
    excellent: number; // > 85%
    good: number; // 70-85%
    average: number; // 50-70%
    needsImprovement: number; // < 50%
  };
}

/**
 * Comparación entre mejores y peores performers
 */
export interface GroupComparison {
  topPerformers: RankedContractor[];
  bottomPerformers: RankedContractor[];
  medianContractor?: RankedContractor;
}

/**
 * Datos extendidos para reporte grupal
 */
export interface GroupReportData extends ReportData {
  rankings: {
    byActivity: RankedContractor[];
    byProductivity: RankedContractor[];
  };
  distribution: GroupDistribution;
  comparison: GroupComparison;
  teamInsights: {
    totalContractors: number;
    atRiskCount: number; // Productividad < 50%
    topPerformersCount: number; // Productividad > 85%
    averageHoursWorked: string;
    groupCohesion: number; // 0-100: qué tan similar es el rendimiento
  };
  filters: {
    applied: Record<string, any>;
    description: string; // Descripción legible de filtros aplicados
  };
}

/**
 * Builder especializado para reportes grupales (múltiples contractors)
 * Proporciona rankings, distribuciones y comparaciones
 */
@Injectable()
export class GroupReportBuilder extends ReportDataBuilder {
  /**
   * Construye un reporte grupal con análisis comparativo
   */
  buildGroupReport(
    adtMetrics: AdtMetricsResponse,
    metadata: ReportMetadata,
  ): GroupReportData {
    const baseReport = this.build(adtMetrics, metadata);

    if (baseReport.items.length === 0) {
      throw new Error('No data found for the specified filters');
    }

    // Generar rankings
    const rankedByActivity = this.rankContractors(
      baseReport.items,
      'activityPercentage',
    );
    const rankedByProductivity = this.rankContractors(
      baseReport.items,
      'productivityScore',
    );

    // Calcular deltas con promedio
    const itemsWithDeltas = this.calculateDeltas(
      baseReport.items,
      baseReport.summary,
    );

    return {
      ...baseReport,
      items: itemsWithDeltas,
      rankings: {
        byActivity: rankedByActivity,
        byProductivity: rankedByProductivity,
      },
      distribution: this.calculateDistribution(baseReport.items),
      comparison: this.buildComparison(rankedByProductivity),
      teamInsights: this.buildTeamInsights(baseReport),
      filters: {
        applied: metadata.filters,
        description: this.buildFiltersDescription(metadata.filters),
      },
    };
  }

  /**
   * Rankea contractors por una métrica específica
   */
  private rankContractors(
    contractors: NormalizedUserActivity[],
    metric: 'activityPercentage' | 'productivityScore',
  ): RankedContractor[] {
    // Ordenar descendente
    const sorted = [...contractors].sort((a, b) => b[metric] - a[metric]);

    return sorted.map((contractor, index) => ({
      ...contractor,
      rank: index + 1,
      performanceLabel: this.getPerformanceLabel(contractor[metric], metric),
      activityDelta: 0, // Se calcula después
      productivityDelta: 0,
    }));
  }

  /**
   * Calcula diferencias con el promedio para cada contractor
   */
  private calculateDeltas(
    contractors: NormalizedUserActivity[],
    summary: ReportSummary,
  ): RankedContractor[] {
    const avgActivity = summary.averageActivity || 0;
    const avgProductivity = summary.averageProductivity || 0;

    return contractors.map((contractor, index) => ({
      ...contractor,
      rank: index + 1,
      performanceLabel: this.getPerformanceLabel(
        contractor.productivityScore,
        'productivityScore',
      ),
      activityDelta: contractor.activityPercentage - avgActivity,
      productivityDelta: contractor.productivityScore - avgProductivity,
    }));
  }

  /**
   * Asigna etiqueta de rendimiento basada en el valor
   */
  private getPerformanceLabel(
    value: number,
    metric: 'activityPercentage' | 'productivityScore',
  ): string {
    if (metric === 'activityPercentage') {
      if (value >= 90) return 'Exceptional Activity';
      if (value >= 80) return 'High Activity';
      if (value >= 60) return 'Good Activity';
      if (value >= 40) return 'Moderate Activity';
      return 'Low Activity';
    } else {
      // productivityScore
      if (value >= 90) return 'Top Performer';
      if (value >= 80) return 'High Performer';
      if (value >= 70) return 'Good Performer';
      if (value >= 50) return 'Average Performer';
      return 'Needs Improvement';
    }
  }

  /**
   * Calcula distribución de contractors por rangos
   */
  private calculateDistribution(
    contractors: NormalizedUserActivity[],
  ): GroupDistribution {
    // Inicializar contadores
    let activityHigh = 0;
    let activityMedium = 0;
    let activityLow = 0;
    let prodExcellent = 0;
    let prodGood = 0;
    let prodAverage = 0;
    let prodNeedsImprovement = 0;

    // Un solo recorrido para clasificar todos los contractors
    for (const contractor of contractors) {
      // Clasificar por actividad
      if (contractor.activityPercentage >= 80) {
        activityHigh++;
      } else if (contractor.activityPercentage >= 50) {
        activityMedium++;
      } else {
        activityLow++;
      }

      // Clasificar por productividad
      if (contractor.productivityScore >= 85) {
        prodExcellent++;
      } else if (contractor.productivityScore >= 70) {
        prodGood++;
      } else if (contractor.productivityScore >= 50) {
        prodAverage++;
      } else {
        prodNeedsImprovement++;
      }
    }

    return {
      activityDistribution: {
        high: activityHigh,
        medium: activityMedium,
        low: activityLow,
      },
      productivityDistribution: {
        excellent: prodExcellent,
        good: prodGood,
        average: prodAverage,
        needsImprovement: prodNeedsImprovement,
      },
    };
  }

  /**
   * Construye comparación entre top y bottom performers
   */
  private buildComparison(
    rankedContractors: RankedContractor[],
  ): GroupComparison {
    const count = rankedContractors.length;
    const topCount = Math.max(1, Math.ceil(count * 0.1)); // Top 10%
    const bottomCount = Math.max(1, Math.ceil(count * 0.1)); // Bottom 10%

    const topPerformers = rankedContractors.slice(0, topCount);
    const bottomPerformers = rankedContractors.slice(-bottomCount).reverse();

    // Mediana (contractor del medio)
    const medianIndex = Math.floor(count / 2);
    const medianContractor = rankedContractors[medianIndex];

    return {
      topPerformers,
      bottomPerformers,
      medianContractor,
    };
  }

  /**
   * Construye insights del equipo/grupo
   */
  private buildTeamInsights(baseReport: ReportData) {
    const contractors = baseReport.items;
    const summary = baseReport.summary;

    const totalContractors = contractors.length;
    const atRiskCount = contractors.filter(
      (c) => c.productivityScore < 50,
    ).length;
    const topPerformersCount = contractors.filter(
      (c) => c.productivityScore >= 85,
    ).length;

    // Calcular promedio de horas trabajadas
    const totalSeconds = contractors.reduce((acc, contractor) => {
      const [hours, minutes, seconds] = (contractor.timeWorked || '00:00:00')
        .split(':')
        .map(Number);
      return acc + hours * 3600 + minutes * 60 + seconds;
    }, 0);

    const avgSeconds = totalSeconds / totalContractors;
    const avgHours = Math.floor(avgSeconds / 3600);
    const avgMinutes = Math.floor((avgSeconds % 3600) / 60);
    const averageHoursWorked = `${avgHours}:${avgMinutes.toString().padStart(2, '0')}:00`;

    // Cohesión del grupo (desviación estándar normalizada)
    const groupCohesion = this.calculateGroupCohesion(contractors);

    return {
      totalContractors,
      atRiskCount,
      topPerformersCount,
      averageHoursWorked,
      groupCohesion,
    };
  }

  /**
   * Calcula cohesión del grupo (qué tan similar es el rendimiento)
   * Retorna 0-100, donde 100 es perfectamente cohesionado
   */
  private calculateGroupCohesion(
    contractors: NormalizedUserActivity[],
  ): number {
    if (contractors.length <= 1) return 100;

    const productivityScores = contractors.map((c) => c.productivityScore);
    const mean =
      productivityScores.reduce((acc, val) => acc + val, 0) /
      productivityScores.length;

    // Calcular desviación estándar
    const squaredDiffs = productivityScores.map((score) =>
      Math.pow(score - mean, 2),
    );
    const variance =
      squaredDiffs.reduce((acc, val) => acc + val, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);

    // Normalizar: menor desviación = mayor cohesión
    // Asumiendo que desviación máxima esperada es 25
    const cohesion = Math.max(0, 100 - (stdDev / 25) * 100);

    return Math.round(cohesion);
  }

  /**
   * Construye descripción legible de filtros aplicados
   */
  private buildFiltersDescription(
    filters: Record<string, string | number | boolean>,
  ): string {
    const parts: string[] = [];

    if (filters.team_id) parts.push(`Team: ${filters.team_id}`);
    if (filters.client_id) parts.push(`Client: ${filters.client_id}`);
    if (filters.country) parts.push(`Country: ${filters.country}`);
    if (filters.job_position) parts.push(`Position: ${filters.job_position}`);

    if (parts.length === 0) return 'All contractors';

    return parts.join(' | ');
  }
}
