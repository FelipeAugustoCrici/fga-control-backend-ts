import { Injectable } from '@nestjs/common';

import { CategoriesRepository } from '../categories.repository';
import { CategoryResponse } from '../categories.types';

// Réplica de CategoryHandler.List.
@Injectable()
export class ListCategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  execute(): Promise<CategoryResponse[]> {
    return this.categoriesRepo.list();
  }
}
