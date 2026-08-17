import { Controller, Get, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { CompaniesRepository } from '../companies.repository';

@Controller('api/v1/companies/me')
export class ListMyCompaniesController {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() auth: AuthContext) {
    const companies = await this.companiesRepo.listByUser(auth.userId);
    return dataResponse(companies);
  }
}
