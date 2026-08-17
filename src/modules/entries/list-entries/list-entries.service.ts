import { Injectable } from '@nestjs/common';

import { buildEntriesFilters, EntriesListQuery } from '../build-entries-query';
import { EntriesRepository } from '../entries.repository';
import { TaskEntryResponse } from '../entries.types';
import { ResolveEntryFilterService } from '../resolve-entry-filter.service';

// Réplica de EntryHandler.List / EntryHandler.ListAll — no Go, os dois
// endpoints chamam exatamente a mesma lógica (svc.List sem paginação).
@Injectable()
export class ListEntriesService {
  constructor(
    private readonly resolveFilter: ResolveEntryFilterService,
    private readonly entriesRepo: EntriesRepository,
  ) {}

  async execute(
    userId: string,
    companyId: string | undefined,
    query: EntriesListQuery,
  ): Promise<TaskEntryResponse[]> {
    const base = await this.resolveFilter.resolve(userId, companyId);
    const filters = buildEntriesFilters(base, query);
    return this.entriesRepo.list(filters);
  }
}
