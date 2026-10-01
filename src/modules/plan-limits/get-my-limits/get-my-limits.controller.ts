import {
  BadRequestException,
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PlansRepository } from '../../plans/plans.repository';
import { PlanLimitsRepository } from '../plan-limits.repository';

// GET /api/v1/plans/limits — réplica de PlanLimitHandler.GetMyLimits, com um
// adicional em relação ao Go: quando x-company-id é enviado, resolve o
// plano REAL da empresa (o do dono/owner, via getCompanyPlanAndRole — mesmo
// padrão já usado em GetMyPermissionsService) em vez de usar auth.planId
// direto. Sem essa resolução, gestor/funcionário (cujo próprio plan_id
// individual é irrelevante/free) recebiam os limites do plano errado, e o
// frontend (usePlanAccess) caía num fallback hardcoded de plano básico
// mesmo numa empresa Enterprise.
// Resposta SEM envelope {data: ...} — o objeto de limites é retornado cru,
// igual ao Go.
@Controller('api/v1/plans/limits')
export class GetMyLimitsController {
  constructor(
    private readonly planLimitsRepo: PlanLimitsRepository,
    private readonly plansRepo: PlansRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() auth: AuthContext, @Req() req: Request) {
    const companyIdHeader = req.headers['x-company-id'];
    const companyId =
      typeof companyIdHeader === 'string' && companyIdHeader !== ''
        ? companyIdHeader
        : undefined;

    let planId = auth.planId;
    if (companyId) {
      const companyPlan = await this.plansRepo.getCompanyPlanAndRole(
        companyId,
        auth.userId,
      );
      if (!companyPlan) {
        throw new BadRequestException('usuário não pertence a esta empresa');
      }
      planId = companyPlan.planId;
    }

    if (!planId) {
      throw new BadRequestException('Plano não encontrado');
    }

    const limits = await this.planLimitsRepo.getByPlanId(planId);
    if (!limits) {
      // Go mapeia esse "não encontrado" para 500 aqui (não 404) —
      // deixa subir como erro genérico via HttpExceptionFilter.
      throw new Error('limites não encontrados para este plano');
    }

    return limits;
  }
}
