import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class GetDashboardController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get() {
    const stats = await this.adminRepo.getDashboardStats();
    return dataResponse(stats);
  }
}
