import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { WikiRepository } from '../wiki.repository';

interface ListWikiQuery {
  page?: string;
  per_page?: string;
  type?: string;
  status?: string;
  sprintId?: string;
  search?: string;
}

// GET /api/v1/wiki — réplica de WikiHandler.List. Envelope próprio (com
// total_pages), diferente do padrão {data,total} usado em outros domínios.
@Controller('api/v1/wiki')
export class ListWikiController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly wikiRepo: WikiRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Query() query: ListWikiQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );

    const page = parsePositiveInt(query.page) ?? 1;
    const perPage = parsePositiveInt(query.per_page) ?? 20;

    const { wikis, total } = await this.wikiRepo.list({
      workspaceId: workspace.workspaceId,
      type: query.type,
      status: query.status,
      sprintId: query.sprintId,
      search: query.search,
      page,
      perPage,
    });

    const totalPages = Math.ceil(total / perPage);
    return {
      data: wikis,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    };
  }
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
