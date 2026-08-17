import { Module } from '@nestjs/common';

import { SettingsModule } from '../settings/settings.module';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryController } from './create-category/create-category.controller';
import { CreateCategoryService } from './create-category/create-category.service';
import { DeleteCategoryController } from './delete-category/delete-category.controller';
import { DeleteCategoryService } from './delete-category/delete-category.service';
import { GetCategoryByCodeController } from './get-category-by-code/get-category-by-code.controller';
import { ListAvailableCategoriesController } from './list-available-categories/list-available-categories.controller';
import { ListCategoriesController } from './list-categories/list-categories.controller';
import { ListCategoriesService } from './list-categories/list-categories.service';
import { ResolveCategoryCodeService } from './resolve-category-code.service';
import { SuggestCategoryController } from './suggest-category/suggest-category.controller';
import { SuggestCategoryService } from './suggest-category/suggest-category.service';

@Module({
  imports: [SettingsModule],
  controllers: [
    ListCategoriesController,
    CreateCategoryController,
    DeleteCategoryController,
    GetCategoryByCodeController,
    SuggestCategoryController,
    ListAvailableCategoriesController,
  ],
  providers: [
    CategoriesRepository,
    ResolveCategoryCodeService,
    ListCategoriesService,
    CreateCategoryService,
    DeleteCategoryService,
    SuggestCategoryService,
  ],
})
export class CategoriesModule {}
