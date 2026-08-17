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
import { SprintsRepository } from '../sprints.repository';

// DELETE /api/v1/sprints/:id — apenas ADMIN/MANAGER (EMPLOYEE não deleta).
@Controller('api/v1/sprints')
export class DeleteSprintController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly sprintsRepo: SprintsRepository,
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
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.sprintsRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('sprint não encontrada');
    }

    await this.sprintsRepo.delete(id, workspace.workspaceId);
  }
}
