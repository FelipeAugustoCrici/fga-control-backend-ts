import { Module } from '@nestjs/common';

import { CreateProjectController } from './create-project/create-project.controller';
import { DeleteProjectController } from './delete-project/delete-project.controller';
import { GetProjectController } from './get-project/get-project.controller';
import { ListProjectsController } from './list-projects/list-projects.controller';
import { ProjectsRepository } from './projects.repository';
import { RecalculateProjectController } from './recalculate-project/recalculate-project.controller';
import { UpdateProjectController } from './update-project/update-project.controller';

@Module({
  controllers: [
    ListProjectsController,
    CreateProjectController,
    UpdateProjectController,
    DeleteProjectController,
    RecalculateProjectController,
    GetProjectController,
  ],
  providers: [ProjectsRepository],
  // ProjectsRepository será usado por modules/sprints e modules/tasks
  // (vínculo com projeto).
  exports: [ProjectsRepository],
})
export class ProjectsModule {}
