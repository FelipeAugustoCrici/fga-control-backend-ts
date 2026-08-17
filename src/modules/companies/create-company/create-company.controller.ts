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
import { CompaniesRepository } from '../companies.repository';
import { CreateCompanyDto } from './create-company.dto';

@Controller('api/v1/companies')
export class CreateCompanyController {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateCompanyDto,
  ) {
    const company = await this.companiesRepo.createWithOwnerAsAdmin(
      dto.name,
      auth.userId,
    );
    return dataResponse(company);
  }
}
