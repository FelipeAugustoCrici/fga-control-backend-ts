import { ConflictException, Injectable } from '@nestjs/common';

import { TimerRepository } from '../timer.repository';
import { ActiveTimerResponse } from '../timer.types';

// Réplica de TimerService.Start.
@Injectable()
export class StartTimerService {
  constructor(private readonly timerRepo: TimerRepository) {}

  async execute(
    userId: string,
    initialSeconds: number,
  ): Promise<ActiveTimerResponse> {
    const existing = await this.timerRepo.findByUserId(userId);
    if (existing) {
      throw new ConflictException('timer já ativo');
    }
    return this.timerRepo.create(userId, initialSeconds);
  }
}
