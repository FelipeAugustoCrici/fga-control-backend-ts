import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanLimitResponse } from './plan-limits.types';

/**
 * Réplica de internal/repository/plan_limit_repository.go. getByPlanId
 * retorna null (não lança) quando o plano não tem limites cadastrados —
 * quem decide o status HTTP é cada caso de uso, porque o Go mapeia esse
 * MESMO "não encontrado" para status diferentes dependendo do endpoint:
 * 404 em GetLimitsByPlan (busca por :plan_id), mas 500 em GetMyLimits e nos
 * checks de limite (que tratam como erro genérico, não "not found").
 */
@Injectable()
export class PlanLimitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getByPlanId(planId: string): Promise<PlanLimitResponse | null> {
    return this.prisma.plan_limits.findUnique({ where: { plan_id: planId } });
  }

  getAll(): Promise<PlanLimitResponse[]> {
    return this.prisma.plan_limits.findMany({ orderBy: { plan_id: 'asc' } });
  }
}
