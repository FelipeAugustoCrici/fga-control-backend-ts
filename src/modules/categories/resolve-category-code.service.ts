import { Injectable } from '@nestjs/common';

import { SettingsRepository } from '../settings/settings.repository';
import { CategoriesRepository } from './categories.repository';

interface CategoryCodeEntry {
  code: string;
  categoryName: string;
}

const FALLBACK_CATEGORY = 'Desenvolvimento';

// Réplica de CategoryService.GetCategoryByCode — compartilhado por
// get-category-by-code e suggest-category (o Go também reusa esse método
// nos dois casos de uso).
@Injectable()
export class ResolveCategoryCodeService {
  constructor(
    private readonly settingsRepo: SettingsRepository,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async resolve(userId: string, code: string): Promise<string> {
    const settings = await this.settingsRepo.getOrCreate(userId);
    const defaultCategory = settings.default_category_name ?? FALLBACK_CATEGORY;

    if (!settings.category_codes) {
      return defaultCategory;
    }

    let categoryCodes: CategoryCodeEntry[];
    try {
      categoryCodes = JSON.parse(
        settings.category_codes,
      ) as CategoryCodeEntry[];
    } catch {
      return defaultCategory;
    }

    const match = categoryCodes.find((entry) => entry.code === code);
    if (!match) {
      return defaultCategory;
    }

    const categories = await this.categoriesRepo.list();
    const exists = categories.some((cat) => cat.name === match.categoryName);
    return exists ? match.categoryName : defaultCategory;
  }

  getDefaultCategoryName(defaultCategoryName: string | undefined): string {
    return defaultCategoryName ?? FALLBACK_CATEGORY;
  }
}
