import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { computeLimitCheck } from '../limit-check.util';
import { PlanLimitsRepository } from '../plan-limits.repository';

// GET /api/v1/plans/limits/check/entries?current=N — réplica de
// PlanLimitHandler.CheckEntriesLimit. Sem envelope {data: ...}.
@Controller('api/v1/plans/limits/check/entries')
export class CheckEntriesLimitController {
  constructor(private readonly planLimitsRepo: PlanLimitsRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async check(
    @CurrentUser() auth: AuthContext,
    @Query('current') currentRaw?: string,
  ) {
    if (!auth.planId) {
      throw new BadRequestException('Plano não encontrado');
    }

    const current = Number(currentRaw);
    if (
      currentRaw === undefined ||
      currentRaw === '' ||
      !Number.isFinite(current)
    ) {
      throw new BadRequestException("Parâmetro 'current' é obrigatório");
    }

    const limits = await this.planLimitsRepo.getByPlanId(auth.planId);
    if (!limits) {
      throw new Error('limites não encontrados para este plano');
    }

    const { canCreate, remaining } = computeLimitCheck(
      limits.max_entries_month,
      current,
    );
    return {
      can_create: canCreate,
      remaining,
      unlimited: remaining === 0 && canCreate,
    };
  }
}
