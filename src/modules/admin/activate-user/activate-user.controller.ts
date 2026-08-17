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

// POST /api/v1/admin/users/:id/activate — sem checagem de existência
// (réplica do Go: id inexistente também retorna sucesso).
@Controller('api/v1/admin')
export class ActivateUserController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Post('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async activate(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }
    await this.adminRepo.activateUser(id);
    return messageResponse('Usuário ativado com sucesso');
  }
}
