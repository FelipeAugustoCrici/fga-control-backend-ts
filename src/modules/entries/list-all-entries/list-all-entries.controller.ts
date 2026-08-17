import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataWithTotalResponse } from '../../../common/http/response.util';
import type { EntriesListQuery } from '../build-entries-query';
import { ListEntriesService } from '../list-entries/list-entries.service';

// GET /api/v1/entries/all — no Go, idêntico a GET /api/v1/entries (mesma
// lógica não paginada). Reusa ListEntriesService em vez de duplicar.
@Controller('api/v1/entries/all')
export class ListAllEntriesController {
  constructor(private readonly listEntriesService: ListEntriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listAll(
    @CurrentUser() auth: AuthContext,
    @Query() query: EntriesListQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const entries = await this.listEntriesService.execute(
      auth.userId,
      companyId,
      query,
    );
    return dataWithTotalResponse(entries, entries.length);
  }
}
