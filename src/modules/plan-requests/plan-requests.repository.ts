import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanRequestResponse } from './plan-requests.types';

// Réplica PARCIAL de internal/repository/admin_repository.go — só o
// create, usado pelo único endpoint não-admin (POST /plan-requests). Listar
// e revisar solicitações fica para o slice `admin`.
@Injectable()
export class PlanRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    requestedPlanId: string,
    currentPlanId: string | null,
  ): Promise<PlanRequestResponse> {
    const row = await this.prisma.plan_requests.create({
      data: {
        user_id: userId,
        current_plan_id: currentPlanId,
        requested_plan_id: requestedPlanId,
      },
    });

    return {
      id: row.id,
      user_id: row.user_id,
      user_name: '',
      user_email: '',
      current_plan_id: row.current_plan_id,
      current_plan_name: null,
      requested_plan_id: row.requested_plan_id,
      requested_plan_name: '',
      status: row.status,
      note: row.note,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
    };
  }
}
