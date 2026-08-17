import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { formatDateOnly } from '../../common/serialization/date';
import { omitEmpty, omitZero } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import type { sprintsModel } from '../../generated/prisma/models';
import {
  CreateSprintInput,
  SprintFilters,
  SprintResponse,
  UpdateSprintInput,
} from './sprints.types';

interface TaskCounts {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
}

// Réplica de internal/repository/sprint_repository.go. total_tasks vem de
// COUNT(t.id) sem filtro de status — tasks.status é string livre
// (TODO/IN_PROGRESS/DONE ou qualquer outro valor), não um enum do Postgres.
@Injectable()
export class SprintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: SprintFilters): Promise<SprintResponse[]> {
    const where: Prisma.sprintsWhereInput = {
      workspace_id: filters.workspaceId,
    };
    if (filters.status) where.status = filters.status;

    const sprints = await this.prisma.sprints.findMany({
      where,
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
    });

    const counts = await this.getTaskCounts(sprints.map((s) => s.id));
    return sprints.map((s) => this.toResponse(s, counts.get(s.id)));
  }

  async getById(
    id: string,
    workspaceId: string,
  ): Promise<SprintResponse | null> {
    const sprint = await this.prisma.sprints.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!sprint) return null;

    const counts = await this.getTaskCounts([id]);
    return this.toResponse(sprint, counts.get(id));
  }

  async create(input: CreateSprintInput): Promise<SprintResponse> {
    const startDate = parseDateStrict(input.startDate, 'startDate');
    const endDate = parseDateStrict(input.endDate, 'endDate');
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate deve ser >= startDate');
    }

    const sprint = await this.prisma.sprints.create({
      data: {
        workspace_id: input.workspaceId,
        name: input.name,
        goal: input.goal ?? null,
        project_id: input.projectId ?? null,
        start_date: startDate,
        end_date: endDate,
        created_by: input.createdBy,
      },
    });
    return this.toResponse(sprint, undefined);
  }

  // Padrão "get-modify-put back" do Go: sempre relê o registro atual e
  // reaplica os campos enviados por cima antes de gravar (mesmo os não
  // enviados são regravados com o valor atual, réplica exata do UPDATE
  // incondicional do Go, que sempre grava os 5 campos).
  async update(
    id: string,
    workspaceId: string,
    input: UpdateSprintInput,
  ): Promise<SprintResponse | null> {
    const current = await this.prisma.sprints.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!current) return null;

    const startDate = input.startDate
      ? parseDateStrict(input.startDate, 'startDate')
      : current.start_date;
    const endDate = input.endDate
      ? parseDateStrict(input.endDate, 'endDate')
      : current.end_date;

    await this.prisma.sprints.updateMany({
      where: { id, workspace_id: workspaceId },
      data: {
        name: input.name ?? current.name,
        goal: input.goal ?? current.goal,
        start_date: startDate,
        end_date: endDate,
        status: input.status ?? current.status,
        updated_at: new Date(),
      },
    });

    return this.getById(id, workspaceId);
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    // Desvincula tasks antes de deletar — réplica do Go.
    await this.prisma.tasks.updateMany({
      where: { sprint_id: id },
      data: { sprint_id: null },
    });
    await this.prisma.sprints.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
  }

  private async getTaskCounts(
    sprintIds: string[],
  ): Promise<Map<string, TaskCounts>> {
    const map = new Map<string, TaskCounts>();
    if (sprintIds.length === 0) return map;

    const grouped = await this.prisma.tasks.groupBy({
      by: ['sprint_id', 'status'],
      where: { sprint_id: { in: sprintIds } },
      _count: { _all: true },
    });

    for (const row of grouped) {
      if (!row.sprint_id) continue;
      const counts = map.get(row.sprint_id) ?? {
        total: 0,
        done: 0,
        inProgress: 0,
        todo: 0,
      };
      counts.total += row._count._all;
      if (row.status === 'DONE') counts.done += row._count._all;
      else if (row.status === 'IN_PROGRESS')
        counts.inProgress += row._count._all;
      else if (row.status === 'TODO') counts.todo += row._count._all;
      map.set(row.sprint_id, counts);
    }
    return map;
  }

  private toResponse(
    sprint: sprintsModel,
    counts: TaskCounts | undefined,
  ): SprintResponse {
    return {
      id: sprint.id,
      workspace_id: sprint.workspace_id,
      project_id: omitEmpty(sprint.project_id),
      name: sprint.name,
      goal: omitEmpty(sprint.goal),
      start_date: formatDateOnly(sprint.start_date),
      end_date: formatDateOnly(sprint.end_date),
      status: sprint.status,
      created_by: sprint.created_by,
      created_at: sprint.created_at,
      updated_at: sprint.updated_at,
      total_tasks: omitZero(counts?.total),
      done_tasks: omitZero(counts?.done),
      in_progress_tasks: omitZero(counts?.inProgress),
      todo_tasks: omitZero(counts?.todo),
    };
  }
}

function parseDateStrict(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} inválido`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} inválido`);
  }
  return date;
}
