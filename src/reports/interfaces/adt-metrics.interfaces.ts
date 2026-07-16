/**
 * Respuesta del microservicio ADT
 */
export interface AdtMetricsResponse {
  summary?: AdtSummary;
  items: NormalizedUserActivity[];
}

/**
 * Resumen agregado proporcionado por ADT
 */
export interface AdtSummary {
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

/**
 * Métrica de usuario individual desde ADT
 */
export interface AdtUserMetric {
  contractor_id?: string;
  contractorId?: string;
  contractor_name?: string;
  contractorName?: string;
  name?: string;
  job_position?: string;
  jobPosition?: string;
  client_id?: string;
  clientId?: string;
  client_name?: string;
  clientName?: string;
  team_id?: string;
  teamId?: string;
  team_name?: string;
  teamName?: string;
  country?: string;
  time_worked?: string;
  timeWorked?: string;
  // ADT devuelve active_percentage, no activity_percentage
  active_percentage?: number;
  activity_percentage?: number;
  activityPercentage?: number;
  productivity_score?: number;
  productivityScore?: number;
  total_beats?: number;
  totalBeats?: number;
  active_beats?: number;
  activeBeats?: number;
  idle_beats?: number;
  idleBeats?: number;
  total_keyboard_inputs?: number;
  totalKeyboardInputs?: number;
  total_mouse_clicks?: number;
  totalMouseClicks?: number;
  avg_keyboard_per_min?: number;
  avgKeyboardPerMin?: number;
  avg_mouse_per_min?: number;
  avgMousePerMin?: number;
  // ADT devuelve esto como número (segundos), no como string HH:MM:SS
  total_session_time_seconds?: number;
  effective_work_seconds?: number;
  effectiveWorkSeconds?: number;
  app_usage?: Array<{
    appName: string;
    seconds: number;
    type?: string;
    category?: string | null;
  }>;
  browser_usage?: Array<{
    domain: string;
    seconds: number;
  }>;
}

/**
 * Usuario normalizado para uso interno
 */
export interface NormalizedUserActivity {
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
  effectiveWorkSeconds?: number; // Tiempo activo en segundos
  totalSessionSeconds?: number; // Tiempo total de sesión en segundos
  appUsage?: Array<{
    appName: string;
    seconds: number;
    type?: string;
    category?: string | null;
  }>;
  browserUsage?: Array<{
    domain: string;
    seconds: number;
  }>;
}
