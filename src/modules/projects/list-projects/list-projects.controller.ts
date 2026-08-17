import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { ProjectsRepository } from '../projects.repository';

interface ListProjectsQuery {
  status?: string;
  search?: string;
  month?: string;
}

@Controller('api/v1/projects')
export class ListProjectsController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Query() query: ListProjectsQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    const projects = await this.projectsRepo.list({
      workspaceId: workspace.workspaceId,
      workspaceType: workspace.workspaceType,
      userId: auth.userId,
      status: query.status,
      search: query.search,
      month: query.month,
    });
    return dataResponse(projects);
  }
}
