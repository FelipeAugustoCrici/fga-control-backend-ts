import { Injectable } from '@nestjs/common';

import { omitEmpty } from '../../../common/serialization/nullable';
import { CategoriesRepository } from '../categories.repository';
import { CategoryResponse } from '../categories.types';
import { ResolveCategoryCodeService } from '../resolve-category-code.service';
import { SettingsRepository } from '../../settings/settings.repository';

export interface CategorySuggestion {
  categoryName: string;
  isCustom: boolean;
  categoryInfo?: CategoryResponse;
}

// Réplica de CategoryService.SuggestCategoryForCode.
@Injectable()
export class SuggestCategoryService {
  constructor(
    private readonly resolveCategoryCode: ResolveCategoryCodeService,
    private readonly settingsRepo: SettingsRepository,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async execute(userId: string, code: string): Promise<CategorySuggestion> {
    const categoryName = await this.resolveCategoryCode.resolve(userId, code);

    const settings = await this.settingsRepo.getOrCreate(userId);
    const defaultCategory = this.resolveCategoryCode.getDefaultCategoryName(
      settings.default_category_name,
    );
    const isCustom = categoryName !== defaultCategory;

    const categories = await this.categoriesRepo.list();
    const categoryInfo = categories.find((cat) => cat.name === categoryName);

    return {
      categoryName,
      isCustom,
      categoryInfo: omitEmpty(categoryInfo),
    };
  }
}
