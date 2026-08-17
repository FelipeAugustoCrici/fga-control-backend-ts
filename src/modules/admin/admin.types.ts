import { CompanyResponse } from '../companies/companies.types';
import { UserResponse } from '../auth/auth.mapper';

// Réplica de model.AdminDashboardStats — nenhum campo tem omitempty.
export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_companies: number;
  users_by_plan: Record<string, number>;
  revenue_by_plan: Record<string, number>;
  inactive_users: number;
  new_users_month: number;
}

// Réplica de model.AdminUserListItem. Note: campos ponteiro no Go
// (PlanID/CompanyID/UsageType/LastActivityAt) NÃO têm omitempty aqui —
// serializam como `null`, diferente de model.User que tem omitempty nos
// mesmos campos.
export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  plan_id: string | null;
  plan_name: string | null;
  company_id: string | null;
  company_name: string | null;
  usage_type: string | null;
  is_admin: boolean;
  is_active: boolean;
  last_activity_at: Date | null;
  created_at: Date;
  status: string;
}

export interface AdminUserFilters {
  search?: string;
  planId?: string;
  usageType?: string;
  status?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortField?: string;
  sortDir?: string;
  page: number;
  perPage: number;
}

export interface AdminUserActivitySummary {
  entries_last_7_days: number;
  entries_last_30_days: number;
  hours_last_7_days: number;
  hours_last_30_days: number;
  days_active: number;
}

// Réplica de model.AdminUserDetail — company/plan têm omitempty (ponteiro
// de struct), os demais campos não.
export interface AdminUserDetail {
  user: UserResponse;
  company?: CompanyResponse;
  plan?: AdminUserDetailPlan;
  total_entries: number;
  total_hours: number;
  last_entry?: Date;
  activity_summary: AdminUserActivitySummary;
}

// Réplica de model.Plan tal como preenchido por getPlanName no Go: só
// ID/Name são reais, os demais campos ficam no zero-value (sem omitempty,
// por isso sempre presentes: price=0, description="", features=null).
export interface AdminUserDetailPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[] | null;
}

export interface AdminPlanStats {
  plan_id: string;
  plan_name: string;
  user_count: number;
  revenue: number;
  active_users: number;
  inactive_users: number;
}
