import { ForbiddenException, Injectable } from '@nestjs/common';

import { AuthRepository } from '../../auth/auth.repository';
import { applyRoleRestrictions } from '../apply-role-restrictions';
import { PlansRepository } from '../plans.repository';
import { PermissionsMap } from '../plans.types';

// Réplica de PermissionHandler.GetMyPermissions (que já embute a lógica de
// PermissionService.GetCompanyPermissions/GetUserPermissions).
@Injectable()
export class GetMyPermissionsService {
  constructor(
    private readonly plansRepo: PlansRepository,
    private readonly authRepo: AuthRepository,
  ) {}

  async execute(
    userId: string,
    companyId: string | undefined,
  ): Promise<PermissionsMap> {
    if (companyId) {
      const companyPlan = await this.plansRepo.getCompanyPlanAndRole(
        companyId,
        userId,
      );
      if (!companyPlan) {
        throw new ForbiddenException('usuário não pertence a esta empresa');
      }
      const base = await this.plansRepo.getPermissionsByPlanId(
        companyPlan.planId,
      );
      return applyRoleRestrictions(base, companyPlan.role);
    }

    const user = await this.authRepo.findById(userId);
    const planId = user?.plan_id || 'personal-free';
    return this.plansRepo.getPermissionsByPlanId(planId);
  }
}
