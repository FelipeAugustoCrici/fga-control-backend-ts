import { Module } from '@nestjs/common';

import { CompaniesModule } from '../companies/companies.module';
import { PlanLimitsModule } from '../plan-limits/plan-limits.module';
import { SettingsModule } from '../settings/settings.module';
import { ApplyRateController } from './apply-rate/apply-rate.controller';
import { CreateEntryController } from './create-entry/create-entry.controller';
import { CreateEntryService } from './create-entry/create-entry.service';
import { DeleteEntryController } from './delete-entry/delete-entry.controller';
import { EntriesRepository } from './entries.repository';
import { GetDashboardController } from './get-dashboard/get-dashboard.controller';
import { GetEntryController } from './get-entry/get-entry.controller';
import { ListAllEntriesController } from './list-all-entries/list-all-entries.controller';
import { ListEntriesController } from './list-entries/list-entries.controller';
import { ListEntriesService } from './list-entries/list-entries.service';
import { ListEntryCategoriesController } from './list-entry-categories/list-entry-categories.controller';
import { ListEntryProjectsController } from './list-entry-projects/list-entry-projects.controller';
import { ResolveEntryFilterService } from './resolve-entry-filter.service';
import { UpdateEntryController } from './update-entry/update-entry.controller';

@Module({
  imports: [CompaniesModule, PlanLimitsModule, SettingsModule],
  controllers: [
    // Rotas estáticas primeiro — GetEntryController (:id) é o único
    // dinâmico neste módulo entre os GETs, e precisa vir por último para
    // não capturar "/entries/all" como se fosse um :id.
    ListEntriesController,
    ListAllEntriesController,
    ListEntryProjectsController,
    ListEntryCategoriesController,
    ApplyRateController,
    CreateEntryController,
    UpdateEntryController,
    DeleteEntryController,
    GetDashboardController,
    GetEntryController,
  ],
  providers: [
    EntriesRepository,
    ResolveEntryFilterService,
    ListEntriesService,
    CreateEntryService,
  ],
  // EntriesRepository é usado por modules/workdays (listagem por período) e
  // modules/reports (mesma lógica de listagem/paginação); ResolveEntryFilterService
  // idem, reusada por modules/reports em vez de duplicada.
  exports: [EntriesRepository, ResolveEntryFilterService, ListEntriesService],
})
export class EntriesModule {}
