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
    const chartData = this.buildChartData(items, metadata.filters);

    return { summary, items, chartData };
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

    // Si ADT no devuelve summary, calcularlo desde los items
    const calculatedSummary = this.calculateSummaryFromItems(items);

    return {
      from: metadata.from,
      to: metadata.to,
      contractorId: metadata.contractorId,
      metricsCount: items.length,
      environment: metadata.environment,
      source: metadata.source,
      filters: this.cleanFilters(metadata.filters),
      // Métricas agregadas desde ADT (o calculadas si ADT no las envía)
      totalUsers: adtSummary?.totalUsers ?? items.length,
      totalTimeWorked: adtSummary?.totalTimeWorked ?? calculatedSummary.totalTimeWorked,
      averageActivity: adtSummary?.averageActivity ?? calculatedSummary.averageActivity,
      averageProductivity: adtSummary?.averageProductivity ?? calculatedSummary.averageProductivity,
      totalActiveBeats: adtSummary?.totalActiveBeats ?? calculatedSummary.totalActiveBeats,
      totalIdleBeats: adtSummary?.totalIdleBeats ?? calculatedSummary.totalIdleBeats,
      totalKeyboardInputs: adtSummary?.totalKeyboardInputs ?? calculatedSummary.totalKeyboardInputs,
      totalMouseClicks: adtSummary?.totalMouseClicks ?? calculatedSummary.totalMouseClicks,
      mostActiveUser: adtSummary?.mostActiveUser ?? calculatedSummary.mostActiveUser,
      leastActiveUser: adtSummary?.leastActiveUser ?? calculatedSummary.leastActiveUser,
      // Session & Connectivity metrics
      totalClients: calculatedSummary.totalClients,
      totalTeams: calculatedSummary.totalTeams,
      totalSessions: items.length, // Cada item es una sesión de contractor
    };
  }

  /**
   * Construye datos del gráfico agrupados dinámicamente según filtros aplicados:
   * - Sin filtro de cliente: agrupa por cliente
   * - Con filtro de cliente (sin equipo): agrupa por equipo
   * - Con filtro de equipo: agrupa por contratista
   */
  private buildChartData(
    items: NormalizedUserActivity[],
    filters: Record<string, string | number | boolean>,
  ): Array<{ label: string; duration: number }> {
    if (items.length === 0) return [];

    // Determinar el nivel de agrupación basado en los filtros aplicados
    const hasTeamFilter = !!filters.team_id;
    const hasClientFilter = !!filters.client_id;

    const dataMap = new Map<string, { totalSeconds: number; count: number }>();

    items.forEach((item) => {
      let groupKey: string;

      if (hasTeamFilter) {
        // Si hay filtro de equipo, agrupar por contratista
        groupKey = item.contractorName || 'Unknown';
      } else if (hasClientFilter) {
        // Si hay filtro de cliente (pero no de equipo), agrupar por equipo
        groupKey = item.teamName || 'Unknown';
      } else {
        // Sin filtros específicos, agrupar por cliente
        groupKey = item.clientName || 'Unknown';
      }

      const sessionSeconds = item.totalSessionSeconds || 0;

      if (!dataMap.has(groupKey)) {
        dataMap.set(groupKey, { totalSeconds: 0, count: 0 });
      }

      const data = dataMap.get(groupKey)!;
      data.totalSeconds += sessionSeconds;
      data.count += 1;
    });

    // Convertir a array y calcular promedio en horas
    return Array.from(dataMap.entries())
      .map(([label, data]) => ({
        label,
        duration: Math.round((data.totalSeconds / data.count / 3600) * 100) / 100, // Horas con 2 decimales
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Ordenar alfabéticamente
  }

  /**
   * Calcula el summary agregando datos de todos los items
   */
  private calculateSummaryFromItems(items: NormalizedUserActivity[]) {
    if (items.length === 0) {
      return {
        totalTimeWorked: '00:00:00',
        averageActivity: 0,
        averageProductivity: 0,
        totalActiveBeats: 0,
        totalIdleBeats: 0,
        totalKeyboardInputs: 0,
        totalMouseClicks: 0,
        mostActiveUser: undefined,
        leastActiveUser: undefined,
      };
    }

    // Sumar todos los valores
    const totalKeyboardInputs = items.reduce((sum, item) => sum + (item.totalKeyboardInputs || 0), 0);
    const totalMouseClicks = items.reduce((sum, item) => sum + (item.totalMouseClicks || 0), 0);
    const totalActiveBeats = items.reduce((sum, item) => sum + (item.totalActiveBeats || 0), 0);
    const totalIdleBeats = items.reduce((sum, item) => sum + (item.totalIdleBeats || 0), 0);

    // Calcular promedios
    const averageActivity = items.reduce((sum, item) => sum + item.activityPercentage, 0) / items.length;
    const averageProductivity = items.reduce((sum, item) => sum + item.productivityScore, 0) / items.length;

    // Calcular tiempo total trabajado sumando todos los timeWorked
    const totalSeconds = items.reduce((sum, item) => {
      const [hours, minutes, seconds] = item.timeWorked.split(':').map(Number);
      return sum + (hours * 3600 + minutes * 60 + seconds);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const totalTimeWorked = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Encontrar usuario más y menos activo
    const sortedByActivity = [...items].sort((a, b) => b.activityPercentage - a.activityPercentage);
    const mostActiveUser = sortedByActivity[0] ? {
      name: sortedByActivity[0].contractorName,
      activityPercentage: sortedByActivity[0].activityPercentage,
    } : undefined;

    const leastActiveUser = sortedByActivity[sortedByActivity.length - 1] ? {
      name: sortedByActivity[sortedByActivity.length - 1].contractorName,
      activityPercentage: sortedByActivity[sortedByActivity.length - 1].activityPercentage,
    } : undefined;

    // Calcular totalClients y totalTeams
    const uniqueClients = new Set(items.map(item => item.clientId).filter(id => id !== 'N/A'));
    const uniqueTeams = new Set(items.map(item => item.teamId).filter(id => id !== 'N/A'));

    return {
      totalTimeWorked,
      averageActivity,
      averageProductivity,
      totalActiveBeats,
      totalIdleBeats,
      totalKeyboardInputs,
      totalMouseClicks,
      mostActiveUser,
      leastActiveUser,
      totalClients: uniqueClients.size,
      totalTeams: uniqueTeams.size,
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
