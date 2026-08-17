import { Module } from '@nestjs/common';

import { CompaniesModule } from '../companies/companies.module';
import { CreateTaskController } from './create-task/create-task.controller';
import { GetTaskController } from './get-task/get-task.controller';
import { ListTasksController } from './list-tasks/list-tasks.controller';
import { SearchTasksController } from './search-tasks/search-tasks.controller';
import { TasksRepository } from './tasks.repository';
import { UpdateTaskAssignController } from './update-task-assign/update-task-assign.controller';
import { UpdateTaskSprintController } from './update-task-sprint/update-task-sprint.controller';
import { UpdateTaskStatusController } from './update-task-status/update-task-status.controller';
import { UpdateTaskController } from './update-task/update-task.controller';

// WorkspaceResolverService vem de TenancyModule (@Global). CompaniesModule
// é importado explicitamente para TasksRepository injetar CompaniesRepository
// (validação de assignee) — TenancyModule só exporta WorkspaceResolverService.
//
// Ordem dos controllers GET importa: rotas estáticas (/, /search) precisam
// vir antes de GetTaskController (:id), senão "/search" seria capturado
// como se fosse um id.
@Module({
  imports: [CompaniesModule],
  controllers: [
    ListTasksController,
    SearchTasksController,
    CreateTaskController,
    UpdateTaskController,
    UpdateTaskStatusController,
    UpdateTaskAssignController,
    UpdateTaskSprintController,
    GetTaskController,
  ],
  providers: [TasksRepository],
})
export class TasksModule {}
