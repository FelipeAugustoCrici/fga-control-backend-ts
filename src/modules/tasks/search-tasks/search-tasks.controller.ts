import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { TasksRepository } from '../tasks.repository';
import { TaskSearchOption } from '../tasks.types';

// GET /api/v1/tasks/search?q=... — autocomplete leve, até 15 resultados,
// só os campos necessários para exibição. Precisa ser registrado ANTES de
// GetTaskController (:id) no módulo para não ser capturado como um id.
@Controller('api/v1/tasks')
export class SearchTasksController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(
    @CurrentUser() auth: AuthContext,
    @Query('q') q: string | undefined,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );

    const { tasks } = await this.tasksRepo.list({
      workspaceId: workspace.workspaceId,
      requesterId: auth.userId,
      requesterRole: workspace.role,
      onlyMine: workspace.role === company_role.EMPLOYEE,
      search: q,
      overdue: false,
      exceeded: false,
      noEntries: false,
      page: 1,
      perPage: 15,
    });

    const options: TaskSearchOption[] = tasks.map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      task_type: task.task_type,
      status: task.status,
      description: task.description || undefined,
      sprint_name: task.sprint_name,
      assigned_user_name: task.assigned_user_name,
    }));
    return dataResponse(options);
  }
}
