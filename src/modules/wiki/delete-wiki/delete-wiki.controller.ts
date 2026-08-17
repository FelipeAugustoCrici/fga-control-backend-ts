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
import { WikiRepository } from '../wiki.repository';

// DELETE /api/v1/wiki/:id — só ADMIN (não MANAGER) pode deletar, diferente
// de create/update que aceitam ADMIN e MANAGER.
@Controller('api/v1/wiki')
export class DeleteWikiController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly wikiRepo: WikiRepository,
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
    if (workspace.role !== company_role.ADMIN) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.wikiRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('wiki não encontrada');
    }

    await this.wikiRepo.delete(id, workspace.workspaceId);
  }
}
