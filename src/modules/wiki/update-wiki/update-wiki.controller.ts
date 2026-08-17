import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { WikiRepository } from '../wiki.repository';
import { UpdateWikiDto } from './update-wiki.dto';

@Controller('api/v1/wiki')
export class UpdateWikiController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly wikiRepo: WikiRepository,
  ) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateWikiDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.wikiRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('wiki não encontrada');
    }

    const wiki = await this.wikiRepo.update(id, workspace.workspaceId, {
      title: dto.title,
      description: dto.description,
      content: dto.content,
      type: dto.type,
      version: dto.version,
      status: dto.status,
      tags: dto.tags,
      sprintId: dto.sprintId,
    });
    return dataResponse(wiki);
  }
}
