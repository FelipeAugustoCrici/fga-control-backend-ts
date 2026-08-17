// Réplica de model.PlanLimit — sem omitempty.
export interface PlanLimitResponse {
  id: string;
  plan_id: string;
  max_entries_month: number;
  storage_mb: number;
  max_projects: number;
  created_at: Date;
}
