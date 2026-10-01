import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../../companies/companies.repository';
import { EntriesRepository } from '../entries.repository';
import {
  RETROACTIVE_WINDOW_DAYS,
  isBeyondRetroactiveWindow,
} from '../retroactive-window';
import { UpdateEntryDto } from './update-entry.dto';

// Até aqui não existia NENHUMA checagem de dono/empresa — qualquer usuário
// logado conseguia editar o lançamento de qualquer outra pessoa só sabendo
// o id. Adicionado: dono sempre pode editar o próprio (com janela
// retroativa se for EMPLOYEE numa empresa); editar lançamento de outra
// pessoa exige ADMIN (qualquer membro) ou MANAGER (só quem reporta direto
// pra ele — hierarquia, ver CompaniesRepository.isDirectReport).
@Controller('api/v1/entries')
export class UpdateEntryController {
  constructor(
    private readonly entriesRepo: EntriesRepository,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly companiesRepo: CompaniesRepository,
  ) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const ownership = await this.entriesRepo.getOwnership(id);
    if (!ownership) {
      throw new NotFoundException('lançamento não encontrado');
    }

    const workspace = await this.workspaceResolver.resolve(
      auth.userId,
      companyId,
    );
    const isOwnEntry = ownership.userId === auth.userId;

    if (!isOwnEntry) {
      if (workspace.workspaceType !== 'COMPANY') {
        throw new ForbiddenException(
          'sem permissão para editar lançamento de outro usuário',
        );
      }
      if (ownership.companyId !== companyId) {
        throw new ForbiddenException(
          'lançamento não pertence a esta empresa',
        );
      }
      const canEditOthers =
        workspace.role === company_role.ADMIN ||
        (workspace.role === company_role.MANAGER &&
          (await this.companiesRepo.isDirectReport(
            companyId!,
            auth.userId,
            ownership.userId,
          )));
      if (!canEditOthers) {
        throw new ForbiddenException(
          'sem permissão para editar lançamento de outro usuário',
        );
      }
    } else if (
      workspace.workspaceType === 'COMPANY' &&
      workspace.role === company_role.EMPLOYEE
    ) {
      const effectiveDate = dto.date ?? ownership.date;
      if (isBeyondRetroactiveWindow(effectiveDate)) {
        throw new ForbiddenException(
          `lançamentos de mais de ${RETROACTIVE_WINDOW_DAYS} dias atrás precisam ser ajustados por um gestor ou administrador`,
        );
      }
    }

    const entry = await this.entriesRepo.update(id, {
      taskId: dto.task_id,
      date: dto.date,
      taskCode: dto.task_code,
      description: dto.description,
      timeSpentMinutes: dto.time_spent_minutes,
      hourlyRate: dto.hourly_rate,
      status: dto.status,
      category: dto.category,
      project: dto.project,
      notes: dto.notes,
      startTime: dto.start_time,
      endTime: dto.end_time,
    });
    if (!entry) {
      throw new NotFoundException('lançamento não encontrado');
    }
    return dataResponse(entry);
  }
}
