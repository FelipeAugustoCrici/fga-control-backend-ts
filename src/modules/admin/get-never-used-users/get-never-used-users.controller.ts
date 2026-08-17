import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

// GET /api/v1/admin/users/never-used — precisa vir ANTES de
// GetUserDetailController (:id) no módulo para não ser capturada como id.
@Controller('api/v1/admin')
export class GetNeverUsedUsersController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('users/never-used')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get() {
    const users = await this.adminRepo.getNeverUsedUsers();
    return dataResponse(users);
  }
}
