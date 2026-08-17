import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { CompaniesRepository } from '../companies.repository';

@Controller('api/v1/companies/members')
export class ListMembersController {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('x-company-id obrigatório');
    }

    const { isMember } = await this.companiesRepo.isMember(
      companyId,
      auth.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('acesso negado');
    }

    const members = await this.companiesRepo.listMembers(companyId);
    return dataResponse(members);
  }
}
