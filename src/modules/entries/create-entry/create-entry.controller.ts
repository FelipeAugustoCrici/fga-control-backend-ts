import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { CreateEntryDto } from './create-entry.dto';
import { CreateEntryService } from './create-entry.service';

@Controller('api/v1/entries')
export class CreateEntryController {
  constructor(private readonly createEntryService: CreateEntryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateEntryDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const entry = await this.createEntryService.execute(
      auth.userId,
      auth.planId,
      companyId,
      dto,
    );
    return dataResponse(entry);
  }
}
