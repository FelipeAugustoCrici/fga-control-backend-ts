// Réplica de model.TaskEntry. user_id/company_id nunca são preenchidos por
// scanEntry() no Go (não fazem parte do SELECT de list/getByID) — por isso,
// com omitempty, essas duas chaves NUNCA aparecem nas respostas que passam
// por esse mapeamento. Reproduzido aqui deixando os dois campos ausentes.
export interface TaskEntryResponse {
  id: string;
  task_id?: string;
  date: string;
  task_code: string;
  description: string;
  time_spent_minutes: number;
  hourly_rate: number;
  total_amount: number;
  status: string;
  category?: string;
  project?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
  created_at: Date;
  updated_at: Date;
}

// Réplica de model.EntryFilters.
export interface EntryFilters {
  userId?: string;
  userIds?: string[];
  companyId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  project?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortField?: string;
  sortDir?: string;
}

export interface CreateEntryInput {
  userId: string;
  companyId?: string | null;
  taskId?: string | null;
  date: string;
  taskCode: string;
  description: string;
  timeSpentMinutes: number;
  hourlyRate: number;
  status: string;
  category?: string | null;
  project?: string | null;
  notes?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

// undefined = campo não enviado (não mexe); string vazia em task_id = desvincula.
export interface UpdateEntryInput {
  taskId?: string;
  date?: string;
  taskCode?: string;
  description?: string;
  timeSpentMinutes?: number;
  hourlyRate?: number;
  status?: string;
  category?: string | null;
  project?: string | null;
  notes?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

// Réplica de model.DashboardSummary — sem omitempty.
export interface DashboardSummaryResponse {
  total_hours: number;
  total_amount: number;
  total_tasks: number;
  avg_hours_per_day: number;
}
