import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { SuggestCategoryDto } from './suggest-category.dto';
import { SuggestCategoryService } from './suggest-category.service';

@Controller('api/v1/categories/suggest')
export class SuggestCategoryController {
  constructor(
    private readonly suggestCategoryService: SuggestCategoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async suggest(
    @CurrentUser() auth: AuthContext,
    @Body() dto: SuggestCategoryDto,
  ) {
    const suggestion = await this.suggestCategoryService.execute(
      auth.userId,
      dto.code,
    );
    return dataResponse(suggestion);
  }
}
