import { HttpStatus, Injectable } from '@nestjs/common';

import { AppException } from '../../../common/http/app-exception';
import { computeLimitCheck } from '../../plan-limits/limit-check.util';
import { PlanLimitsRepository } from '../../plan-limits/plan-limits.repository';
import { EntriesRepository } from '../entries.repository';
import { TaskEntryResponse } from '../entries.types';
import { localMonthRange } from '../local-date';
import { CreateEntryDto } from './create-entry.dto';

/**
 * Réplica de EntryHandler.Create. A checagem de limite do plano é
 * "fail-open" no Go: qualquer erro ao buscar as entries do mês ou os
 * limites do plano faz a checagem ser pulada silenciosamente (cria o
 * lançamento mesmo assim) — só um limite realmente excedido bloqueia.
 */
@Injectable()
export class CreateEntryService {
  constructor(
    private readonly entriesRepo: EntriesRepository,
    private readonly planLimitsRepo: PlanLimitsRepository,
  ) {}

  async execute(
    userId: string,
    planId: string | null,
    companyId: string | undefined,
    dto: CreateEntryDto,
  ): Promise<TaskEntryResponse> {
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

    const targetUserId = dto.target_user_id || userId;

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
