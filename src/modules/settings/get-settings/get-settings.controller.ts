import { Controller, Get, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { GetSettingsService } from './get-settings.service';

@Controller('api/v1/settings')
export class GetSettingsController {
  constructor(private readonly getSettingsService: GetSettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() auth: AuthContext) {
    const settings = await this.getSettingsService.execute(auth.userId);
    return dataResponse(settings);
  }
}
