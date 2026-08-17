import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PlanLimitsRepository } from '../plan-limits.repository';

// GET /api/v1/plans/:plan_id/limits — réplica de
// PlanLimitHandler.GetLimitsByPlan. Sem envelope {data: ...}.
@Controller('api/v1/plans')
export class GetLimitsByPlanController {
  constructor(private readonly planLimitsRepo: PlanLimitsRepository) {}

  @Get(':plan_id/limits')
  @UseGuards(JwtAuthGuard)
  async get(@Param('plan_id') planId: string) {
    const limits = await this.planLimitsRepo.getByPlanId(planId);
    if (!limits) {
      throw new NotFoundException('limites não encontrados para este plano');
    }
    return limits;
  }
}
