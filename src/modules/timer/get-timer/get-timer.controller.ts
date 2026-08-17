import { Controller, Get, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { TimerRepository } from '../timer.repository';

@Controller('api/v1/timer')
export class GetTimerController {
  constructor(private readonly timerRepo: TimerRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() auth: AuthContext) {
    const timer = await this.timerRepo.findByUserId(auth.userId);
    return dataResponse(timer); // null quando não existe
  }
}
