import { Module } from '@nestjs/common';

import { CreateSprintController } from './create-sprint/create-sprint.controller';
import { DeleteSprintController } from './delete-sprint/delete-sprint.controller';
import { GetSprintController } from './get-sprint/get-sprint.controller';
import { ListSprintsController } from './list-sprints/list-sprints.controller';
import { UpdateSprintController } from './update-sprint/update-sprint.controller';
import { SprintsRepository } from './sprints.repository';

// WorkspaceResolverService vem de TenancyModule (@Global), não precisa
// importar aqui.
@Module({
  controllers: [
    ListSprintsController,
    CreateSprintController,
    UpdateSprintController,
    DeleteSprintController,
    GetSprintController,
  ],
  providers: [SprintsRepository],
  exports: [SprintsRepository],
})
export class SprintsModule {}
