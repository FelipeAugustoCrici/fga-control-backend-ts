import { Controller, Post, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { SettingsRepository } from '../../settings/settings.repository';
import { EntriesRepository } from '../entries.repository';

// POST /api/v1/entries/apply-rate — réplica de EntryHandler.ApplyRate.
@Controller('api/v1/entries/apply-rate')
export class ApplyRateController {
  constructor(
    private readonly settingsRepo: SettingsRepository,
    private readonly entriesRepo: EntriesRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async apply(@CurrentUser() auth: AuthContext) {
    const settings = await this.settingsRepo.getOrCreate(auth.userId);
    const updated = await this.entriesRepo.applyRateToEntries(
      auth.userId,
      settings.hourly_rate,
    );

    return messageResponse('hourly_rate aplicado com sucesso', {
      hourly_rate: settings.hourly_rate,
      entries_updated: updated,
    });
  }
}
