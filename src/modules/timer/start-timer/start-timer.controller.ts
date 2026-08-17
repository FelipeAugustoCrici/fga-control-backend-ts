import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { StartTimerDto } from './start-timer.dto';
import { StartTimerService } from './start-timer.service';

@Controller('api/v1/timer')
export class StartTimerController {
  constructor(private readonly startTimerService: StartTimerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async start(@CurrentUser() auth: AuthContext, @Body() dto: StartTimerDto) {
    const timer = await this.startTimerService.execute(
      auth.userId,
      dto.initial_seconds ?? 0,
    );
    return dataResponse(timer);
  }
}
