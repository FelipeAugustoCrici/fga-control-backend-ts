import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { CategoriesRepository } from '../categories.repository';

// GET /api/v1/categories/available — réplica de
// CategoryService.GetAvailableCategories, que no Go é literalmente igual a
// CategoryRepository.List() (sem filtro por usuário, apesar do nome).
@Controller('api/v1/categories/available')
export class ListAvailableCategoriesController {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list() {
    const categories = await this.categoriesRepo.list();
    return dataResponse(categories);
  }
}
