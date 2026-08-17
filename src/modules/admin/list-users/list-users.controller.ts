import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../../common/auth/admin.guard';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import {
  dataResponse,
  paginatedResponse,
} from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';

@Controller('api/v1/admin')
export class ListUsersController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async list(
    @Query('search') search: string | undefined,
    @Query('plan_id') planId: string | undefined,
    @Query('usage_type') usageType: string | undefined,
    @Query('status') status: string | undefined,
    @Query('company_id') companyId: string | undefined,
    @Query('date_from') dateFrom: string | undefined,
    @Query('date_to') dateTo: string | undefined,
    @Query('sort_field') sortField: string | undefined,
    @Query('sort_dir') sortDir: string | undefined,
    @Query('page') pageRaw: string | undefined,
    @Query('per_page') perPageRaw: string | undefined,
  ) {
    let page = Number.parseInt(pageRaw ?? '', 10);
    if (!Number.isFinite(page) || page === 0) page = 1;
    let perPage = Number.parseInt(perPageRaw ?? '', 10);
    if (!Number.isFinite(perPage) || perPage === 0) perPage = 20;

    const { items, total } = await this.adminRepo.getUsers({
      search,
      planId,
      usageType,
      status,
      companyId,
      dateFrom,
      dateTo,
      sortField,
      sortDir,
      page,
      perPage,
    });

    // Réplica do duplo envelope do Go: o handler faz `gin.H{"data": result}`
    // onde `result` já É um PaginatedResponse{data,total,page,per_page} —
    // produz {"data": {"data": [...], "total", "page", "per_page"}}, não o
    // formato plano usado no resto da API.
    return dataResponse(paginatedResponse(items, total, page, perPage));
  }
}
