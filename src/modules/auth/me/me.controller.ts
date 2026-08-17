import { Controller, Get, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { MeService } from './me.service';

@Controller('api/v1/auth')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() auth: AuthContext) {
    const user = await this.meService.execute(auth.userId);
    return dataResponse(user);
  }
}
