import { EntryFilters } from './entries.types';
import { localMonthRange, localToday, localWeekRange } from './local-date';

export interface EntriesListQuery {
  start_date?: string;
  end_date?: string;
  status?: string;
  category?: string;
  project?: string;
  search?: string;
  period?: string;
}

/**
 * Réplica da lógica embutida em EntryHandler.List/ListAll e
 * ReportHandler.buildFilters (idêntica nos três, duplicada no Go — unificada
 * aqui). IMPORTANTE: quando `period` é "today"/"week"/"month", ele
 * SEMPRE sobrescreve start_date/end_date, mesmo que ambos tenham sido
 * enviados explicitamente na query — não é "period só quando start_date
 * ausente" (isso é o comportamento de resolvePeriod em workdays, que é
 * diferente).
 */
export function buildEntriesFilters(
  base: EntryFilters,
  query: EntriesListQuery,
): EntryFilters {
  const filters: EntryFilters = {
    ...base,
    startDate: query.start_date,
    endDate: query.end_date,
    status: query.status,
    category: query.category,
    project: query.project,
    search: query.search,
  };

  switch (query.period) {
    case 'today': {
      const today = localToday();
      filters.startDate = today;
      filters.endDate = today;
      break;
    }
    case 'week': {
      const range = localWeekRange();
      filters.startDate = range.start;
      filters.endDate = range.end;
      break;
    }
    case 'month': {
      const range = localMonthRange();
      filters.startDate = range.start;
      filters.endDate = range.end;
      break;
    }
    default:
      break;
  }

  return filters;
}

export interface DashboardPeriodQuery {
  start_date?: string;
  end_date?: string;
  period?: string;
}

/**
 * Réplica da lógica de período em EntryHandler.Dashboard — DIFERENTE de
 * buildEntriesFilters acima: aqui start_date/end_date (quando presentes)
 * têm prioridade sobre period, e a ausência de period vale "month"
 * (c.DefaultQuery("period", "month")); qualquer valor que não seja
 * "today"/"month" (incluindo "week" explícito) cai no cálculo de semana.
 */
export function resolveDashboardPeriod(query: DashboardPeriodQuery): {
  start: string;
  end: string;
} {
  if (query.start_date) {
    return { start: query.start_date, end: query.end_date ?? '' };
  }

  const period = query.period ?? 'month';
  if (period === 'today') {
    const today = localToday();
    return { start: today, end: today };
  }
  if (period === 'month') {
    return localMonthRange();
  }
  return localWeekRange();
}
