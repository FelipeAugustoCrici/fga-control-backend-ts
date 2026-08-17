import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class CountPendingPlanRequestsController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('plan-requests/count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async count() {
    const count = await this.adminRepo.countPendingPlanRequests();
    return dataResponse({ count });
  }
}
