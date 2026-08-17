// Réplica de model.UserSettings — hourly_rate/daily_hours_goal/monthly_goal
// são floats sem omitempty no Go (sempre presentes, mesmo 0); as duas
// últimas têm omitempty (chave ausente quando null).
export interface UserSettingsResponse {
  id: string;
  hourly_rate: number;
  daily_hours_goal: number;
  monthly_goal: number;
  default_category_name?: string;
  category_codes?: string;
  updated_at: Date;
}
