import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class ListPlanRequestsController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('plan-requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async list(@Query('status') status: string | undefined) {
    const requests = await this.adminRepo.getPlanRequests(status);
    return dataResponse(requests);
  }
}
