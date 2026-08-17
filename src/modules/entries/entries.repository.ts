import { Injectable } from '@nestjs/common';

import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { formatDateOnly } from '../../common/serialization/date';
import { omitEmpty } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import { task_status } from '../../generated/prisma/enums';
import type { task_entriesModel } from '../../generated/prisma/models';
import {
  CreateEntryInput,
  DashboardSummaryResponse,
  EntryFilters,
  TaskEntryResponse,
  UpdateEntryInput,
} from './entries.types';

/**
 * Réplica de internal/repository/entry_repository.go. Os valores
 * financeiros (hourly_rate/total_amount) são TEXT cifrado no banco — por
 * isso agregações (summaryByFilter) não usam SUM() em SQL, igual ao Go:
 * busca as linhas e soma em memória depois de decriptar.
 */
@Injectable()
export class EntriesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async list(filters: EntryFilters): Promise<TaskEntryResponse[]> {
    const rows = await this.prisma.task_entries.findMany({
      where: this.buildWhere(filters),
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
    });
    return rows.map((row) => this.toResponse(row));
  }

  // Réplica de listForUser usada por modules/workdays — mantida como atalho
  // fino sobre list().
  listForUser(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<TaskEntryResponse[]> {
    return this.list({ userId, startDate, endDate });
  }

  async listPaginated(
    filters: EntryFilters,
  ): Promise<{ entries: TaskEntryResponse[]; total: number }> {
    const where = this.buildWhere(filters);
    const total = await this.prisma.task_entries.count({ where });

    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 10;

    const rows = await this.prisma.task_entries.findMany({
      where,
      orderBy: this.buildOrderBy(filters.sortField, filters.sortDir),
      take: perPage,
      skip: (page - 1) * perPage,
    });

    return { entries: rows.map((row) => this.toResponse(row)), total };
  }

  async getById(id: string): Promise<TaskEntryResponse | null> {
    const row = await this.prisma.task_entries.findUnique({ where: { id } });
    return row ? this.toResponse(row) : null;
  }

  async create(input: CreateEntryInput): Promise<TaskEntryResponse> {
    const totalAmount = (input.timeSpentMinutes / 60) * input.hourlyRate;

    const row = await this.prisma.task_entries.create({
      data: {
        user_id: input.userId,
        company_id: input.companyId ?? null,
        task_id: input.taskId ?? null,
        date: new Date(input.date),
        task_code: input.taskCode,
        description: input.description,
        time_spent_minutes: input.timeSpentMinutes,
        hourly_rate: this.encryption.encryptFloat(input.hourlyRate),
        total_amount: this.encryption.encryptFloat(totalAmount),
        status: input.status as task_status,
        category: input.category ?? null,
        project: input.project ?? null,
        notes: input.notes ?? null,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
      },
    });
    return this.toResponse(row);
  }

  // Padrão "get-modify-put back" do Go: sempre relê o registro atual e
  // reaplica só os campos enviados (undefined = não mexe; task_id === ""
  // desvincula). hourly_rate/total_amount são sempre recalculados e
  // re-criptografados, mesmo que nenhum dos dois tenha sido enviado.
  async update(
    id: string,
    input: UpdateEntryInput,
  ): Promise<TaskEntryResponse | null> {
    const current = await this.prisma.task_entries.findUnique({
      where: { id },
    });
    if (!current) return null;

    const data: Prisma.task_entriesUpdateInput = { updated_at: new Date() };

    if (input.taskId !== undefined) {
      data.task_id = input.taskId === '' ? null : input.taskId;
    }
    if (input.date !== undefined) data.date = new Date(input.date);
    if (input.taskCode !== undefined) data.task_code = input.taskCode;
    if (input.description !== undefined) data.description = input.description;
    if (input.status !== undefined) data.status = input.status as task_status;
    if (input.category !== undefined) data.category = input.category;
    if (input.project !== undefined) data.project = input.project;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.timeSpentMinutes !== undefined)
      data.time_spent_minutes = input.timeSpentMinutes;
    if (input.startTime !== undefined) data.start_time = input.startTime;
    if (input.endTime !== undefined) data.end_time = input.endTime;

    const timeSpentMinutes =
      input.timeSpentMinutes ?? current.time_spent_minutes;
    const hourlyRate =
      input.hourlyRate ?? this.encryption.decryptFloat(current.hourly_rate);
    const totalAmount = (timeSpentMinutes / 60) * hourlyRate;
    data.hourly_rate = this.encryption.encryptFloat(hourlyRate);
    data.total_amount = this.encryption.encryptFloat(totalAmount);

    const row = await this.prisma.task_entries.update({ where: { id }, data });
    return this.toResponse(row);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.task_entries.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async listProjects(userId: string): Promise<string[]> {
    const rows = await this.prisma.task_entries.findMany({
      where: { user_id: userId, project: { not: null } },
      select: { project: true },
      distinct: ['project'],
      orderBy: { project: 'asc' },
    });
    return rows
      .map((row) => row.project)
      .filter((p): p is string => p !== null);
  }

  async listCategories(userId: string): Promise<string[]> {
    const rows = await this.prisma.task_entries.findMany({
      where: { user_id: userId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows
      .map((row) => row.category)
      .filter((c): c is string => c !== null);
  }

  async summaryByFilter(
    filters: EntryFilters,
  ): Promise<DashboardSummaryResponse> {
    const rows = await this.prisma.task_entries.findMany({
      where: this.buildWhere(filters),
      select: { time_spent_minutes: true, total_amount: true, category: true },
    });

    const categories = await this.prisma.categories.findMany({
      select: { name: true, billable: true },
    });
    const billableByName = new Map(categories.map((c) => [c.name, c.billable]));

    let billableMinutes = 0;
    let totalAmount = 0;
    let totalCount = 0;

    for (const row of rows) {
      totalCount++;
      const billable = row.category
        ? (billableByName.get(row.category) ?? true)
        : true;
      if (!billable) continue;
      billableMinutes += row.time_spent_minutes;
      totalAmount += this.encryption.decryptFloat(row.total_amount);
    }

    const totalHours = billableMinutes / 60;
    const businessDays =
      filters.startDate && filters.endDate
        ? countBusinessDays(filters.startDate, filters.endDate)
        : 0;

    return {
      total_hours: totalHours,
      total_amount: totalAmount,
      total_tasks: totalCount,
      avg_hours_per_day: businessDays > 0 ? totalHours / businessDays : 0,
    };
  }

  async applyRateToEntries(
    userId: string,
    hourlyRate: number,
  ): Promise<number> {
    const rows = await this.prisma.task_entries.findMany({
      where: { user_id: userId },
      select: { id: true, time_spent_minutes: true },
    });
    if (rows.length === 0) return 0;

    const hourlyEnc = this.encryption.encryptFloat(hourlyRate);
    await this.prisma.$transaction(
      rows.map((row) => {
        const totalAmount = (row.time_spent_minutes / 60) * hourlyRate;
        return this.prisma.task_entries.update({
          where: { id: row.id },
          data: {
            hourly_rate: hourlyEnc,
            total_amount: this.encryption.encryptFloat(totalAmount),
            updated_at: new Date(),
          },
        });
      }),
    );
    return rows.length;
  }

  private buildWhere(filters: EntryFilters): Prisma.task_entriesWhereInput {
    const and: Prisma.task_entriesWhereInput[] = [];

    if (filters.companyId) {
      and.push({
        OR: [
          { company_id: filters.companyId },
          { user_id: filters.userId, company_id: null },
        ],
      });
    } else if (filters.userIds && filters.userIds.length > 0) {
      and.push({ user_id: { in: filters.userIds } });
    } else {
      and.push({ user_id: filters.userId });
    }

    if (filters.startDate)
      and.push({ date: { gte: new Date(filters.startDate) } });
    if (filters.endDate) and.push({ date: { lte: new Date(filters.endDate) } });
    if (filters.status) and.push({ status: filters.status as task_status });
    if (filters.category) and.push({ category: filters.category });
    if (filters.project) and.push({ project: filters.project });
    if (filters.search) {
      const search = filters.search.trim();
      and.push({
        OR: [
          { task_code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: and };
  }

  // Réplica exata do switch em entry_repository.go: sort_dir só é
  // considerado quando sort_field foi explicitamente informado — sem
  // sort_field, a ordenação é sempre "date DESC, created_at DESC" fixa,
  // mesmo que sort_dir tenha sido passado.
  private buildOrderBy(
    sortField?: string,
    sortDir?: string,
  ): Prisma.task_entriesOrderByWithRelationInput[] {
    if (!sortField) {
      return [{ date: 'desc' }, { created_at: 'desc' }];
    }
    const field =
      sortField === 'time_spent_minutes' || sortField === 'total_amount'
        ? sortField
        : 'date';
    const dir = sortDir === 'asc' ? 'asc' : 'desc';
    return [{ [field]: dir }, { created_at: 'desc' }];
  }

  private toResponse(row: task_entriesModel): TaskEntryResponse {
    return {
      id: row.id,
      task_id: omitEmpty(row.task_id),
      date: formatDateOnly(row.date),
      task_code: row.task_code,
      description: row.description,
      time_spent_minutes: row.time_spent_minutes,
      hourly_rate: this.encryption.decryptFloat(row.hourly_rate),
      total_amount: this.encryption.decryptFloat(row.total_amount),
      status: row.status,
      category: omitEmpty(row.category),
      project: omitEmpty(row.project),
      notes: omitEmpty(row.notes),
      start_time: omitEmpty(row.start_time),
      end_time: omitEmpty(row.end_time),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Réplica de countBusinessDays em entry_repository.go: dias úteis (seg-sex)
// entre start e end, inclusive.
export function countBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  let count = 0;
  for (
    let d = new Date(start);
    d.getTime() <= end.getTime();
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const weekday = d.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}
