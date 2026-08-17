// Réplica de model.ActiveTimer — sem omitempty (started_at pode ser null
// explicitamente).
export interface ActiveTimerResponse {
  id: string;
  user_id: string;
  status: 'running' | 'paused';
  started_at: Date | null;
  elapsed_seconds: number;
  created_at: Date;
  updated_at: Date;
}
