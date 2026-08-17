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
import { HolidaysRepository } from '../holidays.repository';
import { CreateHolidayDto } from './create-holiday.dto';

@Controller('api/v1/holidays')
export class CreateHolidayController {
  constructor(private readonly holidaysRepo: HolidaysRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateHolidayDto,
  ) {
    const holiday = await this.holidaysRepo.create(
      dto.date,
      dto.name,
      auth.userId,
    );
    return dataResponse(holiday);
  }
}
