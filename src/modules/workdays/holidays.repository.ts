import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { formatDateOnly } from '../../common/serialization/date';
import { omitEmpty } from '../../common/serialization/nullable';
import type { holidaysModel } from '../../generated/prisma/models';
import { HolidayResponse } from './holidays.types';

// Réplica de internal/repository/holiday_repository.go.
@Injectable()
export class HolidaysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByPeriod(
    userId: string,
    start: string,
    end: string,
  ): Promise<HolidayResponse[]> {
    const rows = await this.prisma.holidays.findMany({
      where: {
        date: { gte: new Date(start), lte: new Date(end) },
        OR: [{ user_id: null }, { user_id: userId }],
      },
      orderBy: { date: 'asc' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async create(
    date: string,
    name: string,
    userId: string,
  ): Promise<HolidayResponse> {
    const row = await this.prisma.holidays.create({
      data: { date: new Date(date), name, user_id: userId },
    });
    return this.toResponse(row);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.holidays.deleteMany({
      where: { id, user_id: userId },
    });
    return result.count > 0;
  }

  private toResponse(row: holidaysModel): HolidayResponse {
    return {
      id: row.id,
      date: formatDateOnly(row.date),
      name: row.name,
      user_id: omitEmpty(row.user_id),
      created_at: row.created_at.toISOString(),
    };
  }
}
