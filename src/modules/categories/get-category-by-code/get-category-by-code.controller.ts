import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { ResolveCategoryCodeService } from '../resolve-category-code.service';

// GET /api/v1/categories/by-code/:code — resposta em camelCase
// (categoryName), réplica exata de CategoryCodeHandler.GetCategoryByCode.
@Controller('api/v1/categories/by-code')
export class GetCategoryByCodeController {
  constructor(
    private readonly resolveCategoryCode: ResolveCategoryCodeService,
  ) {}

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  async getByCode(
    @CurrentUser() auth: AuthContext,
    @Param('code') code: string,
  ) {
    if (!code) {
      throw new BadRequestException('código é obrigatório');
    }

    const categoryName = await this.resolveCategoryCode.resolve(
      auth.userId,
      code,
    );
    return dataResponse({ code, categoryName });
  }
}
