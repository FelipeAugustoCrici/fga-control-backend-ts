import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataWithTotalResponse } from '../../../common/http/response.util';
import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../../companies/companies.repository';
import { resolvePeriod, type PeriodQuery } from '../resolve-period';
import { ListWorkdaysService } from '../list-workdays/list-workdays.service';

// GET /api/v1/companies/members/:userId/workdays — permite ver os
// lançamentos de um colega da mesma empresa. Reaproveita o
// ListWorkdaysService (já genérico por userId, igual ListWorkdaysController
// usa pro próprio usuário). Checagem de permissão: ADMIN enxerga a empresa
// inteira; MANAGER só alcança quem reporta diretamente pra ele (hierarquia
// — ver CompaniesRepository.isDirectReport), não qualquer funcionário.
@Controller('api/v1/companies/members')
export class GetMemberWorkdaysController {
  constructor(
    private readonly companiesRepo: CompaniesRepository,
    private readonly listWorkdaysService: ListWorkdaysService,
  ) {}

  @Get(':userId/workdays')
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Param('userId') targetUserId: string,
    @Query() query: PeriodQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('x-company-id obrigatório');
    }

    const caller = await this.companiesRepo.isMember(companyId, auth.userId);
    const target = await this.companiesRepo.isMember(companyId, targetUserId);
    if (!target.isMember) {
      throw new ForbiddenException('usuário não é membro desta empresa');
    }

    const canView =
      caller.isMember &&
      (caller.role === company_role.ADMIN ||
        (caller.role === company_role.MANAGER &&
          target.managerUserId === auth.userId));
    if (!canView) {
      throw new ForbiddenException(
        'sem permissão para ver os lançamentos deste membro',
      );
    }

    const resolved = resolvePeriod(query);
    const startDate = resolved.startDate;
    let endDate = resolved.endDate;
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'informe start_date e end_date ou period',
      );
    }

    const today = formatLocalDate(new Date());
    if (endDate > today) endDate = today;

    const workdays = await this.listWorkdaysService.execute(
      targetUserId,
      startDate,
      endDate,
    );
    return dataWithTotalResponse(workdays, workdays.length);
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
