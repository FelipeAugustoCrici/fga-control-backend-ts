import {
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { ProjectsRepository } from '../projects.repository';

// POST /api/v1/projects/:id/recalculate — réplica de
// ProjectService.RecalculateHours (vincula task_entries pelo nome do
// projeto quando ainda não têm project_id).
@Controller('api/v1/projects')
export class RecalculateProjectController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  @Post(':id/recalculate')
  @UseGuards(JwtAuthGuard)
  async recalculate(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (
      workspace.workspaceType === 'COMPANY' &&
      workspace.role === company_role.EMPLOYEE
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.projectsRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('projeto não encontrado');
    }

    const project = await this.projectsRepo.recalculateHours(
      id,
      workspace.workspaceId,
    );
    return dataResponse(project);
  }
}
