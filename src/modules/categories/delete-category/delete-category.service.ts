import { Injectable } from '@nestjs/common';

import { CategoriesRepository } from '../categories.repository';

// Réplica de CategoryHandler.Delete.
@Injectable()
export class DeleteCategoryService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  execute(id: string): Promise<void> {
    return this.categoriesRepo.delete(id);
  }
}
