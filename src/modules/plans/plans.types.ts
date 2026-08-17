// Réplica de model.ModulePermission (internal/model/permission.go) — note
// que as chaves JSON são view/create/edit/delete, não can_view etc.
export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionsMap = Record<string, ModulePermission>;

export interface PlanInfo {
  id: string;
  name: string;
  type: string;
  usage_type: string;
  price: number;
  description: string;
  is_active: boolean;
}
