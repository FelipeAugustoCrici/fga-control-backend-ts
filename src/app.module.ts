import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthCommonModule } from './common/auth/auth-common.module';
import { validateEnv } from './common/config/env.validation';
import { FieldEncryptionModule } from './common/crypto/field-encryption.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { TenancyModule } from './common/tenancy/tenancy.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EntriesModule } from './modules/entries/entries.module';
import { PlanLimitsModule } from './modules/plan-limits/plan-limits.module';
import { PlanRequestsModule } from './modules/plan-requests/plan-requests.module';
import { PlansModule } from './modules/plans/plans.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimerModule } from './modules/timer/timer.module';
import { WikiModule } from './modules/wiki/wiki.module';
import { WorkdaysModule } from './modules/workdays/workdays.module';
import { ProjectsModule } from './modules/projects/projects.module';
// Módulos de slice (casos de uso) entram aqui conforme forem migrados.
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthCommonModule,
    FieldEncryptionModule,
    TenancyModule,
    HealthModule,
    AuthModule,
    PlansModule,
    CompaniesModule,
    SettingsModule,
    CategoriesModule,
    WorkdaysModule,
    TimerModule,
    PlanLimitsModule,
    PlanRequestsModule,
    EntriesModule,
    ReportsModule,
    WikiModule,
    ProjectsModule,
    SprintsModule,
    TasksModule,
    AdminModule,
    // ⚠️ ProxyModule deve ser SEMPRE o último import: rotas são resolvidas
    // por ordem de registro no Nest/Express, e esse catch-all mascararia
    // qualquer módulo de slice importado depois dele.
    ProxyModule,
  ],
})
export class AppModule {}
