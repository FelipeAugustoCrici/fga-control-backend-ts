import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { company_role } from '../../generated/prisma/enums';
import { PermissionsMap, PlanInfo } from './plans.types';

export interface CompanyPlanAndRole {
  planId: string;
  role: company_role;
}

// Réplica de internal/repository/permission_repository.go + os trechos de
// internal/repository/company_repository.go usados por PermissionService.
@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlans(): Promise<PlanInfo[]> {
    const rows = await this.prisma.plans.findMany({
      where: { is_active: true },
      orderBy: [{ usage_type: 'asc' }, { price: 'asc' }],
    });

    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      usage_type: p.usage_type,
      price: p.price,
      description: p.description ?? '',
      is_active: p.is_active,
    }));
  }

  async getPermissionsByPlanId(planId: string): Promise<PermissionsMap> {
    const rows = await this.prisma.plan_modules.findMany({
      where: { plan_id: planId, modules: { is_active: true } },
      select: {
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        modules: { select: { key: true } },
      },
    });

    const perms: PermissionsMap = {};
    for (const row of rows) {
      perms[row.modules.key] = {
        view: row.can_view,
        create: row.can_create,
        edit: row.can_edit,
        delete: row.can_delete,
      };
    }
    return perms;
  }

  async getCompanyPlanAndRole(
    companyId: string,
    userId: string,
  ): Promise<CompanyPlanAndRole | null> {
    const member = await this.prisma.company_members.findUnique({
      where: { company_id_user_id: { company_id: companyId, user_id: userId } },
      select: {
        role: true,
        companies: {
          select: {
            users_companies_owner_idTousers: { select: { plan_id: true } },
          },
        },
      },
    });
    if (!member) return null;

    return {
      planId:
        member.companies.users_companies_owner_idTousers.plan_id ??
        'personal-free',
      role: member.role,
    };
  }
}
