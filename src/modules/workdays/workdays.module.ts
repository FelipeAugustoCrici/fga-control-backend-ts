import { Module } from '@nestjs/common';

import { CompaniesModule } from '../companies/companies.module';
import { EntriesModule } from '../entries/entries.module';
import { CreateHolidayController } from './create-holiday/create-holiday.controller';
import { DeleteHolidayController } from './delete-holiday/delete-holiday.controller';
import { GetMemberWorkdaysController } from './get-member-workdays/get-member-workdays.controller';
import { HolidaysRepository } from './holidays.repository';
import { ListWorkdaysController } from './list-workdays/list-workdays.controller';
import { ListWorkdaysService } from './list-workdays/list-workdays.service';

@Module({
  imports: [EntriesModule, CompaniesModule],
  controllers: [
    ListWorkdaysController,
    GetMemberWorkdaysController,
    CreateHolidayController,
    DeleteHolidayController,
  ],
  providers: [HolidaysRepository, ListWorkdaysService],
})
export class WorkdaysModule {}
