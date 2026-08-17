import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

// POST /api/v1/admin/users/:id/deactivate — sem checagem de existência
// (réplica do Go: id inexistente também retorna sucesso).
@Controller('api/v1/admin')
export class DeactivateUserController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Post('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deactivate(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }
    await this.adminRepo.deactivateUser(id);
    return messageResponse('Usuário desativado com sucesso');
  }
}
