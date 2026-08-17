import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { ListCategoriesService } from './list-categories.service';

@Controller('api/v1/categories')
export class ListCategoriesController {
  constructor(private readonly listCategoriesService: ListCategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list() {
    const categories = await this.listCategoriesService.execute();
    return dataResponse(categories);
  }
}
