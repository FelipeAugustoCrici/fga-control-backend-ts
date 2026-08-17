import { Injectable } from '@nestjs/common';

import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { omitEmpty } from '../../common/serialization/nullable';
import type { user_settingsModel } from '../../generated/prisma/models';
import { UserSettingsResponse } from './settings.types';

export interface UpdateSettingsInput {
  hourlyRate: number;
  dailyHoursGoal: number;
  monthlyGoal: number;
  defaultCategoryName: string | null;
  categoryCodes: string | null;
}

// Réplica de internal/repository/settings_repository.go.
@Injectable()
export class SettingsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async getOrCreate(userId: string): Promise<UserSettingsResponse> {
    const existing = await this.prisma.user_settings.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      return this.toResponse(existing);
    }

    const created = await this.prisma.user_settings.create({
      data: {
        user_id: userId,
        hourly_rate: this.encryption.encryptFloat(0),
        daily_hours_goal: this.encryption.encryptFloat(8),
        monthly_goal: this.encryption.encryptFloat(0),
        default_category_name: 'Desenvolvimento',
        category_codes: '[]',
      },
    });
    return this.toResponse(created);
  }

  async update(
    userId: string,
    input: UpdateSettingsInput,
  ): Promise<UserSettingsResponse> {
    const defaultCategoryName = input.defaultCategoryName ?? 'Desenvolvimento';
    const categoryCodes = input.categoryCodes ?? '[]';

    const data = {
      hourly_rate: this.encryption.encryptFloat(input.hourlyRate),
      daily_hours_goal: this.encryption.encryptFloat(input.dailyHoursGoal),
      monthly_goal: this.encryption.encryptFloat(input.monthlyGoal),
      default_category_name: defaultCategoryName,
      category_codes: categoryCodes,
    };

    const row = await this.prisma.user_settings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: { ...data, updated_at: new Date() },
    });
    return this.toResponse(row);
  }

  private toResponse(row: user_settingsModel): UserSettingsResponse {
    return {
      id: row.id,
      hourly_rate: this.encryption.decryptFloat(row.hourly_rate),
      daily_hours_goal: this.encryption.decryptFloat(row.daily_hours_goal),
      // Réplica de `if monthlyEnc != "" { decrypt }` no Go — string vazia
      // (default da coluna) não passa pelo decrypt, fica 0.
      monthly_goal: row.monthly_goal
        ? this.encryption.decryptFloat(row.monthly_goal)
        : 0,
      default_category_name: omitEmpty(row.default_category_name),
      category_codes: omitEmpty(row.category_codes),
      updated_at: row.updated_at,
    };
  }
}
