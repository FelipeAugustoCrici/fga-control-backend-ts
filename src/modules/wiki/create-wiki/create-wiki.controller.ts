import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { WikiRepository } from '../wiki.repository';
import { CreateWikiDto } from './create-wiki.dto';

// POST /api/v1/wiki — réplica de WikiHandler.Create + WikiService.Create
// (apenas ADMIN/MANAGER podem criar).
@Controller('api/v1/wiki')
export class CreateWikiController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly wikiRepo: WikiRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateWikiDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const wiki = await this.wikiRepo.create({
      workspaceId: workspace.workspaceId,
      createdBy: auth.userId,
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
