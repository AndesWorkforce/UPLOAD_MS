import { Injectable } from '@nestjs/common';
import {
  AdtMetricsResponse,
  NormalizedUserActivity,
} from '../interfaces/adt-metrics.interfaces';
import { ReportData, ReportSummary } from '../interfaces/report.interfaces';

export interface ReportMetadata {
  from: string;
  to: string;
  contractorId?: string;
  filters: Record<string, string | number | boolean>;
  source: string;
  environment: string;
}

/**
 * Builder para construir datos estructurados de reporte
 */
@Injectable()
export class ReportDataBuilder {
  /**
   * Construye ReportData combinando métricas de ADT y metadata
   */
  build(
    adtMetrics: AdtMetricsResponse,
    metadata: ReportMetadata,
  ): ReportData {
    const items = adtMetrics.items;
    const summary = this.buildSummary(adtMetrics, items, metadata);

    return { summary, items };
  }

  /**
   * Construye el summary del reporte
   */
  private buildSummary(
    adtMetrics: AdtMetricsResponse,
    items: NormalizedUserActivity[],
    metadata: ReportMetadata,
  ): ReportSummary {
    const adtSummary = adtMetrics.summary;

    return {
      from: metadata.from,
      to: metadata.to,
      contractorId: metadata.contractorId,
      metricsCount: items.length,
      environment: metadata.environment,
      source: metadata.source,
      filters: this.cleanFilters(metadata.filters),
      // Métricas agregadas desde ADT
      totalUsers: adtSummary?.totalUsers ?? items.length,
      totalTimeWorked: adtSummary?.totalTimeWorked ?? 'N/A',
      averageActivity: adtSummary?.averageActivity ?? 0,
      averageProductivity: adtSummary?.averageProductivity ?? 0,
      totalActiveBeats: adtSummary?.totalActiveBeats ?? 0,
      totalIdleBeats: adtSummary?.totalIdleBeats ?? 0,
      totalKeyboardInputs: adtSummary?.totalKeyboardInputs ?? 0,
      totalMouseClicks: adtSummary?.totalMouseClicks ?? 0,
      mostActiveUser: adtSummary?.mostActiveUser,
      leastActiveUser: adtSummary?.leastActiveUser,
    };
  }

  /**
   * Limpia filtros removiendo valores vacíos
   */
  private cleanFilters(
    filters: Record<string, string | number | boolean>,
  ): Record<string, string | number | boolean> {
    return Object.entries(filters)
      .filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      })
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string | number | boolean>,
      );
  }
}
