import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class GetPlanStatsController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('plans')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get() {
    const stats = await this.adminRepo.getPlanStats();
    return dataResponse(stats);
  }
}
