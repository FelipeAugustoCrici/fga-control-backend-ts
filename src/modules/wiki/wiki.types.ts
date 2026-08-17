// Réplica de model.Wiki.
export interface WikiResponse {
  id: string;
  workspace_id: string;
  sprint_id?: string;
  title: string;
  description?: string;
  content: string;
  type: string;
  version?: string;
  status: string;
  tags: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  created_by_name?: string;
  sprint_name?: string;
}

// Réplica de model.WikiFilters.
export interface WikiFilters {
  workspaceId: string;
  sprintId?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateWikiInput {
  workspaceId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  content?: string;
  type: string;
  version?: string | null;
  status?: string;
  tags?: string[];
  sprintId?: string | null;
}

// sprintId: undefined = não mexe; null = desvincula (SQL NULL); string = vincula.
// Réplica do **string do Go (dupla indireção só nesse campo).
export interface UpdateWikiInput {
  title?: string;
  description?: string;
  content?: string;
  type?: string;
  version?: string;
  status?: string;
  tags?: string[];
  sprintId?: string | null;
}
