import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import type { active_timersModel } from '../../generated/prisma/models';
import { ActiveTimerResponse } from './timer.types';

// Réplica de internal/repository/timer_repository.go.
@Injectable()
export class TimerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ActiveTimerResponse | null> {
    const row = await this.prisma.active_timers.findUnique({
      where: { user_id: userId },
    });
    return row ? this.toResponse(row) : null;
  }

  async create(
    userId: string,
    initialSeconds: number,
  ): Promise<ActiveTimerResponse> {
    const row = await this.prisma.active_timers.create({
      data: {
        user_id: userId,
        status: 'running',
        started_at: new Date(),
        elapsed_seconds: initialSeconds,
      },
    });
    return this.toResponse(row);
  }

  async updatePause(
    userId: string,
    elapsedSeconds: number,
  ): Promise<ActiveTimerResponse | null> {
    const result = await this.prisma.active_timers.updateMany({
      where: { user_id: userId },
      data: {
        status: 'paused',
        elapsed_seconds: elapsedSeconds,
        started_at: null,
        updated_at: new Date(),
      },
    });
    if (result.count === 0) return null;
    return this.findByUserId(userId);
  }

  async updateResume(userId: string): Promise<ActiveTimerResponse | null> {
    const result = await this.prisma.active_timers.updateMany({
      where: { user_id: userId },
      data: {
        status: 'running',
        started_at: new Date(),
        updated_at: new Date(),
      },
    });
    if (result.count === 0) return null;
    return this.findByUserId(userId);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.prisma.active_timers.deleteMany({
      where: { user_id: userId },
    });
    return result.count > 0;
  }

  private toResponse(row: active_timersModel): ActiveTimerResponse {
    return {
      id: row.id,
      user_id: row.user_id,
      status: row.status as 'running' | 'paused',
      started_at: row.started_at,
      elapsed_seconds: row.elapsed_seconds,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
