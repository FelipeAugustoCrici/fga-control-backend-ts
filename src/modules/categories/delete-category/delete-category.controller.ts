import { Controller, Delete, Param, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { DeleteCategoryService } from './delete-category.service';

@Controller('api/v1/categories')
export class DeleteCategoryController {
  constructor(private readonly deleteCategoryService: DeleteCategoryService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.deleteCategoryService.execute(id);
    return messageResponse('categoria removida');
  }
}
