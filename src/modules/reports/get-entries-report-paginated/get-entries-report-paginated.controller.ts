import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { paginatedResponse } from '../../../common/http/response.util';
import {
  buildEntriesFilters,
  EntriesListQuery,
} from '../../entries/build-entries-query';
import { EntriesRepository } from '../../entries/entries.repository';
import { ResolveEntryFilterService } from '../../entries/resolve-entry-filter.service';

interface PaginatedReportQuery extends EntriesListQuery {
  page?: string;
  per_page?: string;
  sort_field?: string;
  sort_dir?: string;
}

// GET /api/v1/reports/entries-paginated — réplica de
// ReportHandler.GetEntriesPaginated.
@Controller('api/v1/reports/entries-paginated')
export class GetEntriesReportPaginatedController {
  constructor(
    private readonly resolveFilter: ResolveEntryFilterService,
    private readonly entriesRepo: EntriesRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(
    @CurrentUser() auth: AuthContext,
    @Query() query: PaginatedReportQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const base = await this.resolveFilter.resolve(auth.userId, companyId);
    const filters = buildEntriesFilters(base, query);

    let page = parsePositiveInt(query.page);
    let perPage = parsePositiveInt(query.per_page, 1000);
    if (!page) page = 1;
    if (!perPage) perPage = 10;

    filters.page = page;
    filters.perPage = perPage;
    filters.sortField = query.sort_field ?? 'date';
    filters.sortDir = query.sort_dir ?? 'desc';

    const { entries, total } = await this.entriesRepo.listPaginated(filters);
    return paginatedResponse(entries, total, page, perPage);
  }
}

function parsePositiveInt(
  value: string | undefined,
  max?: number,
): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  if (max !== undefined && parsed > max) return undefined;
  return parsed;
}
