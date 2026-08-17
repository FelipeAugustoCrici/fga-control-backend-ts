import { Injectable } from '@nestjs/common';

import { SettingsRepository } from '../settings.repository';
import { UserSettingsResponse } from '../settings.types';

// Réplica de SettingsService.Get.
@Injectable()
export class GetSettingsService {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  execute(userId: string): Promise<UserSettingsResponse> {
    return this.settingsRepo.getOrCreate(userId);
  }
}
