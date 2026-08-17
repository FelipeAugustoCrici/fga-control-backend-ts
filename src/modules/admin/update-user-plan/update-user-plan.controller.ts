import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';
import { UpdateUserPlanDto } from './update-user-plan.dto';

// PUT /api/v1/admin/users/:id/plan — sem checagem de existência do usuário
// nem do plano (réplica do Go).
@Controller('api/v1/admin')
export class UpdateUserPlanController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Put('users/:id/plan')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateUserPlanDto) {
    if (!id) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }
    if (!dto.plan_id) {
      throw new BadRequestException('plan_id é obrigatório');
    }
    await this.adminRepo.updateUserPlan(id, dto.plan_id);
    return messageResponse('Plano atualizado com sucesso');
  }
}
