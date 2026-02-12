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
  totalKeyboardInputs?: number;
  totalMouseClicks?: number;
  totalActiveBeats?: number;
  totalIdleBeats?: number;
  effectiveWorkSeconds?: number;
  totalSessionSeconds?: number;
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
  // Session & Connectivity metrics
  totalClients?: number;
  totalTeams?: number;
  totalSessions?: number;
}

export interface ReportData {
  summary: ReportSummary;
  items: UserActivityReport[];
  chartData?: GroupedChartData[];
}

/**
 * Datos agrupados para el gráfico de Session & Connectivity
 */
export interface GroupedChartData {
  label: string; // Nombre del cliente o equipo
  duration: number; // Duración en horas (decimal)
}

/**
 * Datos de aplicaciones más usadas
 */
export interface AppUsage {
  appName: string;
  seconds: number;
  type?: string;
  percentage?: number;
}

/**
 * Datos de sitios web más visitados
 */
export interface BrowserUsage {
  domain: string;
  seconds: number;
  percentage?: number;
}

/**
 * Datos de actividad por hora para gráficos
 */
export interface HourlyChartData {
  hour: string; // "08:00", "09:00", etc.
  duration: number; // Horas (decimal)
  productivity: number; // 0-100
}

/**
 * Datos de sesiones de un contractor
 */
export interface ContractorSession {
  session_id: string;
  session_start: string;
  session_end: string;
  total_seconds: number;
  active_seconds: number;
  idle_seconds: number;
  productivity_score:number;
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
