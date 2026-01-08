import { Injectable } from '@nestjs/common';
import {
  AdtMetricsResponse,
  AdtUserMetric,
  NormalizedUserActivity,
} from '../interfaces/adt-metrics.interfaces';

/**
 * Mapper para normalizar datos recibidos de ADT
 * Convierte snake_case a camelCase y maneja valores por defecto
 */
@Injectable()
export class AdtMetricsMapper {
  /**
   * Mapea la respuesta completa de ADT
   */
  mapResponse(rawData: unknown): AdtMetricsResponse {
    if (!rawData || typeof rawData !== 'object') {
      return { items: [] };
    }

    const data = rawData as Record<string, unknown>;

    // Caso 1: Respuesta estructurada con summary e items
    if ('items' in data) {
      return {
        summary: this.extractSummary(data),
        items: this.extractItems(data.items),
      };
    }

    // Caso 2: Array de métricas sin summary
    if (Array.isArray(rawData)) {
      return {
        items: this.extractItems(rawData),
      };
    }

    // Caso 3: Métrica individual
    return {
      items: [this.normalizeUserMetric(data as AdtUserMetric)],
    };
  }

  /**
   * Normaliza un usuario individual a formato interno
   */
  normalizeUserMetric(metric: AdtUserMetric): NormalizedUserActivity {
    return {
      contractorId:
        metric.contractorId || metric.contractor_id || 'N/A',
      contractorName:
        metric.contractorName ||
        metric.contractor_name ||
        metric.name ||
        'Unknown',
      jobPosition: metric.jobPosition || metric.job_position || 'N/A',
      clientId: metric.clientId || metric.client_id || 'N/A',
      clientName: metric.clientName || metric.client_name || 'N/A',
      teamId: metric.teamId || metric.team_id || 'N/A',
      teamName: metric.teamName || metric.team_name || 'N/A',
      country: metric.country || 'N/A',
      timeWorked: metric.timeWorked || metric.time_worked || '00:00:00',
      activityPercentage:
        metric.activityPercentage ?? metric.activity_percentage ?? 0,
      productivityScore:
        metric.productivityScore ?? metric.productivity_score ?? 0,
    };
  }

  /**
   * Extrae el summary si existe
   */
  private extractSummary(
    data: Record<string, unknown>,
  ): AdtMetricsResponse['summary'] {
    if (!data.summary || typeof data.summary !== 'object') {
      return undefined;
    }

    const summary = data.summary as Record<string, unknown>;

    return {
      totalUsers: (summary.totalUsers as number) || 0,
      totalTimeWorked: (summary.totalTimeWorked as string) || '00:00:00',
      averageActivity: (summary.averageActivity as number) || 0,
      averageProductivity: (summary.averageProductivity as number) || 0,
      totalActiveBeats: (summary.totalActiveBeats as number) || 0,
      totalIdleBeats: (summary.totalIdleBeats as number) || 0,
      totalKeyboardInputs: (summary.totalKeyboardInputs as number) || 0,
      totalMouseClicks: (summary.totalMouseClicks as number) || 0,
      mostActiveUser: summary.mostActiveUser
        ? (summary.mostActiveUser as {
            name: string;
            activityPercentage: number;
          })
        : undefined,
      leastActiveUser: summary.leastActiveUser
        ? (summary.leastActiveUser as {
            name: string;
            activityPercentage: number;
          })
        : undefined,
    };
  }

  /**
   * Extrae y normaliza el array de items
   */
  private extractItems(items: unknown): NormalizedUserActivity[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => this.normalizeUserMetric(item as AdtUserMetric));
  }
}
