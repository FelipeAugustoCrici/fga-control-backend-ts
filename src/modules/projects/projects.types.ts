// Réplica de model.Project — campos calculados (total_*) sem omitempty,
// sempre presentes.
export interface ProjectResponse {
  id: string;
  workspace_id: string;
  workspace_type: string;
  name: string;
  description?: string;
  code?: string;
  status: string;
  color?: string;
  icon?: string;
  created_by: string;
  start_date?: string;
  end_date?: string;
  archived_at?: Date;
  created_at: Date;
  updated_at: Date;
  total_tasks: number;
  total_sprints: number;
  total_hours: number;
  total_amount: number;
}

export interface ProjectFilters {
  workspaceId: string;
  workspaceType: string;
  userId: string;
  status?: string;
  search?: string;
  month?: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  workspaceType: string;
  createdBy: string;
  name: string;
  description?: string | null;
  code?: string | null;
  status?: string;
  color?: string | null;
  icon?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

// undefined em qualquer campo = COALESCE(novo, atual) no Go — não mexe.
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  code?: string;
  status?: string;
  color?: string;
  icon?: string;
  startDate?: string;
  endDate?: string;
}
