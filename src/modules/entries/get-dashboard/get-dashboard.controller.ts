import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import type { DashboardPeriodQuery } from '../build-entries-query';
import { resolveDashboardPeriod } from '../build-entries-query';
import { EntriesRepository } from '../entries.repository';
import { localToday } from '../local-date';
import { ResolveEntryFilterService } from '../resolve-entry-filter.service';

// GET /api/v1/dashboard (fora do prefixo /entries) — réplica de
// EntryHandler.Dashboard.
@Controller('api/v1/dashboard')
export class GetDashboardController {
  constructor(
    private readonly resolveFilter: ResolveEntryFilterService,
    private readonly entriesRepo: EntriesRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(
    @CurrentUser() auth: AuthContext,
    @Query() query: DashboardPeriodQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const base = await this.resolveFilter.resolve(auth.userId, companyId);
    const { start, end } = resolveDashboardPeriod(query);

    const today = localToday();
    const endDate = end > today ? today : end;

    const summary = await this.entriesRepo.summaryByFilter({
      ...base,
      startDate: start,
      endDate,
    });
    return dataResponse(summary);
  }
}
