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
import { PauseTimerService } from './pause-timer.service';

@Controller('api/v1/timer')
export class PauseTimerController {
  constructor(private readonly pauseTimerService: PauseTimerService) {}

  @Patch('pause')
  @UseGuards(JwtAuthGuard)
  async pause(@CurrentUser() auth: AuthContext) {
    const timer = await this.pauseTimerService.execute(auth.userId);
    if (!timer) {
      throw new NotFoundException('nenhum timer ativo');
    }
    return dataResponse(timer);
  }
}
