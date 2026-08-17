import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { TimerRepository } from '../timer.repository';

// Réplica de TimerHandler.Delete — idempotente, sempre 204 (mesmo se já
// não existia).
@Controller('api/v1/timer')
export class DeleteTimerController {
  constructor(private readonly timerRepo: TimerRepository) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() auth: AuthContext): Promise<void> {
    await this.timerRepo.delete(auth.userId);
  }
}
