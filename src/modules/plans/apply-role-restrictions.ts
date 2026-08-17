import { company_role } from '../../generated/prisma/enums';
import { PermissionsMap } from './plans.types';

// Réplica exata de applyRoleRestrictions em internal/service/permission_service.go.
export function applyRoleRestrictions(
  base: PermissionsMap,
  role: company_role,
): PermissionsMap {
  const result: PermissionsMap = {};
  for (const [key, perm] of Object.entries(base)) {
    result[key] = { ...perm };
  }

  if (role === company_role.EMPLOYEE) {
    for (const key of Object.keys(result)) {
      const p = result[key];
      if (key === 'ENTRIES' || key === 'TIME_GRID') {
        p.create = true;
        p.edit = true;
        p.delete = false;
      } else if (key === 'TEAM') {
        p.view = true;
        p.create = false;
        p.edit = false;
        p.delete = false;
      } else {
        p.create = false;
        p.edit = false;
        p.delete = false;
      }
    }
  } else if (role === company_role.MANAGER) {
    for (const key of Object.keys(result)) {
      const p = result[key];
      if (key === 'ENTRIES' || key === 'REPORTS') {
        p.delete = false;
      } else if (key === 'TEAM') {
        p.create = true;
        p.edit = true;
        p.delete = false;
      }
    }
  }
  // ADMIN: mantém as permissões do plano sem restrições.

  return result;
}
