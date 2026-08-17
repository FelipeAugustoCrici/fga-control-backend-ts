import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataWithTotalResponse } from '../../../common/http/response.util';
import type { EntriesListQuery } from '../../entries/build-entries-query';
import { ListEntriesService } from '../../entries/list-entries/list-entries.service';

// GET /api/v1/reports/entries — réplica de ReportHandler.GetEntries, que no
// Go usa exatamente a mesma lógica de EntryHandler.List (reusada aqui via
// ListEntriesService em vez de duplicada).
@Controller('api/v1/reports/entries')
export class GetEntriesReportController {
  constructor(private readonly listEntriesService: ListEntriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(
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
