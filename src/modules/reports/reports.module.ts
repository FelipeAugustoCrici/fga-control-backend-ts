import { Module } from '@nestjs/common';

import { EntriesModule } from '../entries/entries.module';
import { GetEntriesReportController } from './get-entries-report/get-entries-report.controller';
import { GetEntriesReportPaginatedController } from './get-entries-report-paginated/get-entries-report-paginated.controller';

@Module({
  imports: [EntriesModule],
  controllers: [
    GetEntriesReportController,
    GetEntriesReportPaginatedController,
  ],
})
export class ReportsModule {}
