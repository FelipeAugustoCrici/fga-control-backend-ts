/**
 * Réplica de resolvePeriod() em internal/handler/workday_handler.go. Usa
 * hora LOCAL do processo (Go também usa time.Now()/time.Local aqui,
 * diferente da iteração de datas em si que é UTC) — por isso o backend
 * precisa da mesma TZ (America/Sao_Paulo) configurada no Go via
 * docker-compose, senão "hoje"/"semana"/"mês" podem divergir perto da
 * virada do dia.
 */
export interface PeriodQuery {
  start_date?: string;
  end_date?: string;
  period?: string;
}

export interface ResolvedPeriod {
  startDate: string;
  endDate: string;
}

export function resolvePeriod(query: PeriodQuery): ResolvedPeriod {
  if (query.start_date) {
    return { startDate: query.start_date, endDate: query.end_date ?? '' };
  }

  const now = new Date();
  switch (query.period) {
    case 'today': {
      const today = formatLocalDate(now);
      return { startDate: today, endDate: today };
    }
    case 'week': {
      let weekday = now.getDay();
      if (weekday === 0) weekday = 7;
      const monday = addLocalDays(now, -(weekday - 1));
      const sunday = addLocalDays(monday, 6);
      return {
        startDate: formatLocalDate(monday),
        endDate: formatLocalDate(sunday),
      };
    }
    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: formatLocalDate(first),
        endDate: formatLocalDate(lastDay),
      };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
