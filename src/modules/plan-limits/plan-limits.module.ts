import { Module } from '@nestjs/common';

import { CheckEntriesLimitController } from './check-entries-limit/check-entries-limit.controller';
import { CheckProjectsLimitController } from './check-projects-limit/check-projects-limit.controller';
import { GetAllLimitsController } from './get-all-limits/get-all-limits.controller';
import { GetLimitsByPlanController } from './get-limits-by-plan/get-limits-by-plan.controller';
import { GetMyLimitsController } from './get-my-limits/get-my-limits.controller';
import { PlanLimitsRepository } from './plan-limits.repository';

@Module({
  controllers: [
    GetMyLimitsController,
    GetAllLimitsController,
    CheckEntriesLimitController,
    CheckProjectsLimitController,
    // Rota dinâmica :plan_id/limits por último entre os controllers deste
    // módulo por clareza (não é estritamente necessário aqui, já que os
    // paths têm número de segmentos diferentes das rotas estáticas acima).
    GetLimitsByPlanController,
  ],
  providers: [PlanLimitsRepository],
  // Usado por modules/entries no create-entry (checagem de limite mensal
  // antes de criar um novo lançamento).
  exports: [PlanLimitsRepository],
})
export class PlanLimitsModule {}
