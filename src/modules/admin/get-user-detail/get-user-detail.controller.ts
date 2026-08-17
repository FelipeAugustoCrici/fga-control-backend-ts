import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class GetUserDetailController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async get(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }
    const detail = await this.adminRepo.getUserDetail(id);
    return dataResponse(detail);
  }
}
