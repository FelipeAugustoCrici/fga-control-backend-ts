import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PlanLimitsRepository } from '../plan-limits.repository';

// GET /api/v1/plans/limits/all — sem envelope {data: ...}.
@Controller('api/v1/plans/limits/all')
export class GetAllLimitsController {
  constructor(private readonly planLimitsRepo: PlanLimitsRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  get() {
    return this.planLimitsRepo.getAll();
  }
}
