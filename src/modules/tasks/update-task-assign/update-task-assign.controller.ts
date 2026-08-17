import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { TasksRepository } from '../tasks.repository';
import { UpdateTaskAssignDto } from './update-task-assign.dto';

// PATCH /api/v1/tasks/:id/assign — indisponível no workspace pessoal;
// apenas ADMIN/MANAGER podem reatribuir.
@Controller('api/v1/tasks')
export class UpdateTaskAssignController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  async updateAssign(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskAssignDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.workspaceType === 'PERSONAL') {
      throw new ForbiddenException(
        'reatribuição não disponível no workspace pessoal',
      );
    }
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    // chave ausente/null -> null (desvincula); string (incl. "") passa direto.
    const assignedUserId = dto.assignedUserId ?? null;
    if (assignedUserId) {
      await this.tasksRepo.validateAssignee(
        workspace.workspaceId,
        assignedUserId,
      );
    }

    const existing = await this.tasksRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('tarefa não encontrada');
    }

    const task = await this.tasksRepo.updateAssign(
      id,
      workspace.workspaceId,
      assignedUserId,
    );
    return dataResponse(task);
  }
}
