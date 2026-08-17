// Réplica de model.Sprint — start_date/end_date são strings obrigatórias
// (não omitempty); os 4 campos calculados TÊM omitempty e são inteiros
// (zero-value 0 também é omitido, não só null/undefined).
export interface SprintResponse {
  id: string;
  workspace_id: string;
  project_id?: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  total_tasks?: number;
  done_tasks?: number;
  in_progress_tasks?: number;
  todo_tasks?: number;
}

export interface SprintFilters {
  workspaceId: string;
  status?: string;
}

export interface CreateSprintInput {
  workspaceId: string;
  createdBy: string;
  name: string;
  goal?: string | null;
  projectId?: string | null;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}
