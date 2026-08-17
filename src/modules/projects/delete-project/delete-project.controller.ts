import {
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { ProjectsRepository } from '../projects.repository';

@Controller('api/v1/projects')
export class DeleteProjectController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async delete(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Headers('x-company-id') companyId?: string,
  ): Promise<void> {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (
      workspace.workspaceType === 'COMPANY' &&
      workspace.role !== company_role.ADMIN
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.projectsRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('projeto não encontrado');
    }

    await this.projectsRepo.delete(id, workspace.workspaceId);
  }
}
