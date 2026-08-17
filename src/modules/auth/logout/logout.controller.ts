import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { LogoutService } from './logout.service';

@Controller('api/v1/auth')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request) {
    const bearer = req.headers.authorization;
    const token = bearer?.startsWith('Bearer ')
      ? bearer.slice('Bearer '.length)
      : '';
    if (!token) {
      throw new BadRequestException('token não informado');
    }

    await this.logoutService.execute(token);
    return messageResponse('logout realizado');
  }
}
