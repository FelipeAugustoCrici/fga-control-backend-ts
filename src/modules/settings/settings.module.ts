import { Module } from '@nestjs/common';

import { GetSettingsController } from './get-settings/get-settings.controller';
import { GetSettingsService } from './get-settings/get-settings.service';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsController } from './update-settings/update-settings.controller';
import { UpdateSettingsService } from './update-settings/update-settings.service';

@Module({
  controllers: [GetSettingsController, UpdateSettingsController],
  providers: [SettingsRepository, GetSettingsService, UpdateSettingsService],
  // SettingsRepository é usado por modules/categories (by-code/suggest
  // dependem da categoria padrão e dos códigos configurados pelo usuário).
  exports: [SettingsRepository],
})
export class SettingsModule {}
