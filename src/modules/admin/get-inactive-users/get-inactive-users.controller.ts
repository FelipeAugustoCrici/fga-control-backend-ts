import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

// GET /api/v1/admin/users/inactive — precisa vir ANTES de
// GetUserDetailController (:id) no módulo para não ser capturada como id.
@Controller('api/v1/admin')
export class GetInactiveUsersController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('users/inactive')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get(@Query('days') daysRaw: string | undefined) {
    const parsed = Number.parseInt(daysRaw ?? '', 10);
    const days = daysRaw && Number.isFinite(parsed) ? parsed : 7;
    const users = await this.adminRepo.getInactiveUsers(days);
    return dataResponse(users);
  }
}
