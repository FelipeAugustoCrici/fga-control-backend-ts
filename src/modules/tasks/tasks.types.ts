// Réplica de model.Task — code é preenchido pelo trigger de banco
// (generate_task_code), nunca escrito pela aplicação. due_date é
// time.Time (não date-only), diferente de sprint.start_date/end_date.
export interface TaskResponse {
  id: string;
  workspace_id: string;
  code: string;
  project_id?: string;
  sprint_id?: string;
  assigned_user_id?: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  estimated_hours: number;
  worked_hours: number;
  due_date?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  assigned_user_name?: string;
  assigned_user_email?: string;
  created_by_name?: string;
  sprint_name?: string;
}

// Réplica do subconjunto retornado por GET /tasks/search (taskOption no Go).
// description é string (não ponteiro) com omitempty no Go — "" também é
// omitido, não só null/undefined.
export interface TaskSearchOption {
  id: string;
  code: string;
  title: string;
  task_type: string;
  status: string;
  description?: string;
  sprint_name?: string;
  assigned_user_name?: string;
}

export interface TaskFilters {
  workspaceId: string;
  assignedUserId?: string;
  status?: string;
  priority?: string;
  taskType?: string;
  sprintId?: string;
  projectId?: string;
  search?: string;
  onlyMine: boolean;
  requesterId: string;
  requesterRole: string;
  overdue: boolean;
  exceeded: boolean;
  noEntries: boolean;
  sortField?: string;
  sortDir?: string;
  page: number;
  perPage: number;
}

export interface CreateTaskInput {
  workspaceId: string;
  createdBy: string;
  workspaceType: string;
  title: string;
  description?: string | null;
  taskType?: string;
  assignedUserId?: string | null;
  sprintId?: string | null;
  projectId?: string | null;
  priority: string;
  estimatedHours: number;
  dueDate?: string | null;
}

// undefined = não mexe; "" = limpar (título/prioridade/etc não têm esse
// caso — só sprintId/projectId/dueDate suportam "" para desvincular/limpar).
export interface UpdateTaskInput {
  workspaceId: string;
  workspaceType: string;
  title?: string;
  description?: string;
  taskType?: string;
  assignedUserId?: string;
  sprintId?: string;
  projectId?: string;
  priority?: string;
  estimatedHours?: number;
  dueDate?: string;
}
