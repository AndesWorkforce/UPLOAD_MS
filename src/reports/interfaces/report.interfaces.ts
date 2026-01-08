/**
 * UserActivityReport ahora extiende de NormalizedUserActivity
 * para mantener compatibilidad con datos de ADT
 */
export interface UserActivityReport {
  contractorId: string;
  contractorName: string;
  jobPosition: string;
  clientId: string;
  clientName: string;
  teamId: string;
  teamName: string;
  country: string;
  timeWorked: string;
  activityPercentage: number;
  productivityScore: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  contractorId?: string;
  metricsCount: number;
  environment: string;
  source: string;
  filters: Record<string, any>;
  // Agregados
  totalUsers: number;
  totalTimeWorked: string; // "HH:MM:SS"
  averageActivity: number;
  averageProductivity: number;
  totalActiveBeats: number;
  totalIdleBeats: number;
  totalKeyboardInputs: number;
  totalMouseClicks: number;
  mostActiveUser?: {
    name: string;
    activityPercentage: number;
  };
  leastActiveUser?: {
    name: string;
    activityPercentage: number;
  };
}

export interface ReportData {
  summary: ReportSummary;
  items: UserActivityReport[];
}

/**
 * Configuración de campos disponibles para selección dinámica
 */
export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
}

/**
 * Campos disponibles para reportes dinámicos
 */
export const AVAILABLE_REPORT_FIELDS: FieldConfig[] = [
  { key: 'contractorName', label: 'User', required: true },
  { key: 'jobPosition', label: 'Job Position', required: false },
  { key: 'clientName', label: 'Client', required: false },
  { key: 'teamName', label: 'Team', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'timeWorked', label: 'Time Worked', required: true },
  { key: 'activityPercentage', label: 'Activity %', required: false },
  { key: 'productivityScore', label: 'Productivity', required: false },
];
