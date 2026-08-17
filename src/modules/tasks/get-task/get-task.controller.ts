import {
  Controller,
  ForbiddenException,
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
import { company_role } from '../../../generated/prisma/enums';
import { TasksRepository } from '../tasks.repository';

// GET /api/v1/tasks/:id — funcionário só pode ver a própria task.
@Controller('api/v1/tasks')
export class GetTaskController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
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

    const task = await this.tasksRepo.getById(id, workspace.workspaceId);
    if (!task) {
      throw new NotFoundException('tarefa não encontrada');
    }
    if (
      workspace.role === company_role.EMPLOYEE &&
      task.assigned_user_id !== auth.userId
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }
    return dataResponse(task);
  }
}
