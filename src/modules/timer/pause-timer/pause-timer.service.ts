import { Injectable } from '@nestjs/common';

import { TimerRepository } from '../timer.repository';
import { ActiveTimerResponse } from '../timer.types';

// Réplica de TimerService.Pause: soma o tempo decorrido desde started_at ao
// elapsed_seconds já acumulado antes de persistir.
@Injectable()
export class PauseTimerService {
  constructor(private readonly timerRepo: TimerRepository) {}

  async execute(userId: string): Promise<ActiveTimerResponse | null> {
    const timer = await this.timerRepo.findByUserId(userId);
    if (!timer) return null;

    let newElapsed = timer.elapsed_seconds;
    if (timer.started_at) {
      const secondsSinceStart = Math.floor(
        (Date.now() - timer.started_at.getTime()) / 1000,
      );
      newElapsed += secondsSinceStart;
    }

    return this.timerRepo.updatePause(userId, newElapsed);
  }
}
