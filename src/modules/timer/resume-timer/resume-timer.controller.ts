import {
  Controller,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { TimerRepository } from '../timer.repository';

@Controller('api/v1/timer')
export class ResumeTimerController {
  constructor(private readonly timerRepo: TimerRepository) {}

  @Patch('resume')
  @UseGuards(JwtAuthGuard)
  async resume(@CurrentUser() auth: AuthContext) {
    const timer = await this.timerRepo.updateResume(auth.userId);
    if (!timer) {
      throw new NotFoundException('nenhum timer ativo');
    }
    return dataResponse(timer);
  }
}
