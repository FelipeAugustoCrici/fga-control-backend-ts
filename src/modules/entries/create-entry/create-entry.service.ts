import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';

import { AppException } from '../../../common/http/app-exception';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../../companies/companies.repository';
import { computeLimitCheck } from '../../plan-limits/limit-check.util';
import { PlanLimitsRepository } from '../../plan-limits/plan-limits.repository';
import { EntriesRepository } from '../entries.repository';
import { TaskEntryResponse } from '../entries.types';
import { localMonthRange } from '../local-date';
import {
  RETROACTIVE_WINDOW_DAYS,
  isBeyondRetroactiveWindow,
} from '../retroactive-window';
import { CreateEntryDto } from './create-entry.dto';

/**
 * Réplica de EntryHandler.Create, com duas regras de permissão adicionadas
 * (não existiam nem no Go nem aqui): target_user_id só é aceito de
 * ADMIN/MANAGER lançando pra alguém da própria empresa, e EMPLOYEE não
 * lança retroativo além de RETROACTIVE_WINDOW_DAYS sem um gestor.
 *
 * A checagem de limite do plano é "fail-open" no Go: qualquer erro ao
 * buscar as entries do mês ou os limites do plano faz a checagem ser
 * pulada silenciosamente (cria o lançamento mesmo assim) — só um limite
 * realmente excedido bloqueia.
 */
@Injectable()
export class CreateEntryService {
  constructor(
    private readonly entriesRepo: EntriesRepository,
    private readonly planLimitsRepo: PlanLimitsRepository,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly companiesRepo: CompaniesRepository,
  ) {}

  async execute(
    userId: string,
    planId: string | null,
    companyId: string | undefined,
    dto: CreateEntryDto,
  ): Promise<TaskEntryResponse> {
    const workspace = await this.workspaceResolver.resolve(userId, companyId);

    let targetUserId = userId;
    if (dto.target_user_id && dto.target_user_id !== userId) {
      if (workspace.workspaceType !== 'COMPANY') {
        throw new ForbiddenException(
          'apenas administradores ou gerentes podem lançar horas em nome de outro usuário',
        );
      }
      const target = await this.companiesRepo.isMember(
        companyId!,
        dto.target_user_id,
      );
      if (!target.isMember) {
        throw new ForbiddenException(
          'usuário alvo não é membro desta empresa',
        );
      }
      // ADMIN alcança qualquer membro; MANAGER só quem reporta direto pra
      // ele (hierarquia, não "qualquer gestor lança pra qualquer um").
      const canActForOthers =
        workspace.role === company_role.ADMIN ||
        (workspace.role === company_role.MANAGER &&
          target.managerUserId === userId);
      if (!canActForOthers) {
        throw new ForbiddenException(
          'apenas administradores ou o gestor direto podem lançar horas em nome de outro usuário',
        );
      }
      targetUserId = dto.target_user_id;
    }

    // Janela de retroatividade: só restringe EMPLOYEE lançando pra si
    // mesmo numa empresa. ADMIN/MANAGER (inclusive lançando em nome de
    // outro membro) e contas pessoais não têm esse limite.
    if (
      workspace.workspaceType === 'COMPANY' &&
      workspace.role === company_role.EMPLOYEE &&
      isBeyondRetroactiveWindow(dto.date)
    ) {
      throw new ForbiddenException(
        `lançamentos de mais de ${RETROACTIVE_WINDOW_DAYS} dias atrás precisam ser feitos por um gestor ou administrador`,
      );
    }

    if (planId) {
      const precheck = await this.tryLoadLimitPrecheck(userId, planId);
      if (precheck) {
        const { canCreate, remaining } = computeLimitCheck(
          precheck.maxEntriesMonth,
          precheck.current,
        );
        if (!canCreate) {
          throw new AppException(
            HttpStatus.FORBIDDEN,
            'Limite de lançamentos mensais atingido',
            {
              limit_reached: true,
              current: precheck.current,
              remaining,
              message:
                'Você atingiu o limite de lançamentos do seu plano. Faça upgrade para continuar.',
            },
          );
        }
      }
    }

    return this.entriesRepo.create({
      userId: targetUserId,
      companyId: companyId ?? null,
      taskId: dto.task_id ?? null,
      date: dto.date,
      taskCode: dto.task_code,
      description: dto.description,
      timeSpentMinutes: dto.time_spent_minutes,
      hourlyRate: dto.hourly_rate ?? 0,
      status: dto.status,
      category: dto.category ?? null,
      project: dto.project ?? null,
      notes: dto.notes ?? null,
      startTime: dto.start_time ?? null,
      endTime: dto.end_time ?? null,
    });
  }

  private async tryLoadLimitPrecheck(
    userId: string,
    planId: string,
  ): Promise<{ maxEntriesMonth: number; current: number } | null> {
    try {
      const range = localMonthRange();
      const currentEntries = await this.entriesRepo.list({
        userId,
        startDate: range.start,
        endDate: range.end,
      });
      const limits = await this.planLimitsRepo.getByPlanId(planId);
      if (!limits) return null;
      return {
        maxEntriesMonth: limits.max_entries_month,
        current: currentEntries.length,
      };
    } catch {
      return null;
    }
  }
}
