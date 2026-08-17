import {
  BadRequestException,
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PlanLimitsRepository } from '../plan-limits.repository';

// GET /api/v1/plans/limits — réplica de PlanLimitHandler.GetMyLimits.
// Resposta SEM envelope {data: ...} — o objeto de limites é retornado cru,
// igual ao Go.
@Controller('api/v1/plans/limits')
export class GetMyLimitsController {
  constructor(private readonly planLimitsRepo: PlanLimitsRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() auth: AuthContext) {
    if (!auth.planId) {
      throw new BadRequestException('Plano não encontrado');
    }

    const limits = await this.planLimitsRepo.getByPlanId(auth.planId);
    if (!limits) {
      // Go mapeia esse "não encontrado" para 500 aqui (não 404) —
      // deixa subir como erro genérico via HttpExceptionFilter.
      throw new Error('limites não encontrados para este plano');
    }

    return limits;
  }
}
