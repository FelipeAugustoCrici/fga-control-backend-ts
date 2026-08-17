import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { WikiRepository } from '../wiki.repository';

@Controller('api/v1/wiki')
export class GetWikiController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly wikiRepo: WikiRepository,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    const wiki = await this.wikiRepo.getById(id, workspace.workspaceId);
    if (!wiki) {
      throw new NotFoundException('wiki não encontrada');
    }
    return dataResponse(wiki);
  }
}
