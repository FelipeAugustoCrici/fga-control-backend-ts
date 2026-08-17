import { Injectable } from '@nestjs/common';

import { EntriesRepository } from '../../entries/entries.repository';
import { TaskEntryResponse } from '../../entries/entries.types';
import { HolidaysRepository } from '../holidays.repository';
import { classifyWorkdays } from '../workday-classifier';
import { WorkDayResponse } from '../workdays.types';

// Réplica de WorkdayService.ListWorkdays.
@Injectable()
export class ListWorkdaysService {
  constructor(
    private readonly entriesRepo: EntriesRepository,
    private readonly holidaysRepo: HolidaysRepository,
  ) {}

  async execute(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<WorkDayResponse[]> {
    const holidays = await this.holidaysRepo.listByPeriod(
      userId,
      startDate,
      endDate,
    );
    const holidayDates = new Set(holidays.map((h) => h.date));

    const entries = await this.entriesRepo.listForUser(
      userId,
      startDate,
      endDate,
    );
    const entriesByDate = new Map<string, TaskEntryResponse[]>();
    for (const entry of entries) {
      const list = entriesByDate.get(entry.date);
      if (list) list.push(entry);
      else entriesByDate.set(entry.date, [entry]);
    }

    return classifyWorkdays(startDate, endDate, entriesByDate, holidayDates);
  }
}
