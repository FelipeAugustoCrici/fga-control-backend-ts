import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../companies.repository';
import { UpdateMemberManagerDto } from './update-member-manager.dto';

// PATCH /api/v1/companies/members/:userId/manager — atribui/troca quem é o
// gestor direto de um membro (hierarquia de reporte). Não existia nem no Go
// nem aqui antes — feature nova. ADMIN-only: é uma mudança de estrutura
// organizacional, não uma operação do dia a dia de um gestor.
@Controller('api/v1/companies/members')
export class UpdateMemberManagerController {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  @Patch(':userId/manager')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberManagerDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('x-company-id obrigatório');
    }

    const caller = await this.companiesRepo.isMember(companyId, auth.userId);
    if (!caller.isMember || caller.role !== company_role.ADMIN) {
      throw new ForbiddenException(
        'apenas administradores podem definir hierarquia de equipe',
      );
    }

    const target = await this.companiesRepo.isMember(companyId, targetUserId);
    if (!target.isMember) {
      throw new NotFoundException('usuário não é membro desta empresa');
    }

    const managerUserId = dto.manager_user_id ?? null;

    if (managerUserId) {
      if (managerUserId === targetUserId) {
        throw new BadRequestException(
          'um usuário não pode ser gestor de si mesmo',
        );
      }
      const manager = await this.companiesRepo.isMember(
        companyId,
        managerUserId,
      );
      if (
        !manager.isMember ||
        (manager.role !== company_role.ADMIN &&
          manager.role !== company_role.MANAGER)
      ) {
        throw new BadRequestException(
          'o gestor indicado precisa ser administrador ou gerente desta empresa',
        );
      }
    }

    await this.companiesRepo.setManager(companyId, targetUserId, managerUserId);
    return messageResponse('gestor atualizado');
  }
}
