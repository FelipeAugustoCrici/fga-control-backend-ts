import { Body, Controller, Put, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { UpdateSettingsDto } from './update-settings.dto';
import { UpdateSettingsService } from './update-settings.service';

@Controller('api/v1/settings')
export class UpdateSettingsController {
  constructor(private readonly updateSettingsService: UpdateSettingsService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Body() dto: UpdateSettingsDto,
  ) {
    const settings = await this.updateSettingsService.execute(auth.userId, dto);
    return dataResponse(settings);
  }
}
