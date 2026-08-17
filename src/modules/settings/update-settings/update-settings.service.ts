import { Injectable } from '@nestjs/common';

import { SettingsRepository } from '../settings.repository';
import { UserSettingsResponse } from '../settings.types';
import { UpdateSettingsDto } from './update-settings.dto';

// Réplica de SettingsService.Update.
@Injectable()
export class UpdateSettingsService {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  execute(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<UserSettingsResponse> {
    return this.settingsRepo.update(userId, {
      hourlyRate: dto.hourly_rate,
      dailyHoursGoal: dto.daily_hours_goal,
      monthlyGoal: dto.monthly_goal ?? 0,
      defaultCategoryName: dto.default_category_name ?? null,
      categoryCodes: dto.category_codes ?? null,
    });
  }
}
