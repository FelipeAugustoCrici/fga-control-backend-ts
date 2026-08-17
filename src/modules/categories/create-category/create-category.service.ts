import { Injectable } from '@nestjs/common';

import { CategoriesRepository } from '../categories.repository';
import { CategoryResponse } from '../categories.types';
import { CreateCategoryDto } from './create-category.dto';

// Réplica de CategoryRepository.Create: upsert por name, billable default true.
@Injectable()
export class CreateCategoryService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  execute(dto: CreateCategoryDto): Promise<CategoryResponse> {
    return this.categoriesRepo.upsert(
      dto.name,
      dto.color,
      dto.billable ?? true,
    );
  }
}
