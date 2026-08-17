import { TaskEntryResponse } from '../entries/entries.types';
import { WorkDayResponse } from './workdays.types';

/**
 * Lógica pura de internal/service/workday_service.go (ListWorkdays +
 * buildWorkDay), sem acesso a banco — testável isoladamente, igual ao
 * padrão de workday_service_test.go no Go (mocks de repositório).
 */
export function parseDateStrict(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${value} inválido`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${value} inválido`);
  }
  return date;
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function buildWorkDay(
  date: string,
  entries: TaskEntryResponse[],
): WorkDayResponse {
  if (entries.length === 0) {
    return {
      date,
      status: 'not_worked',
      worked_hours: '00:00',
      total_minutes: 0,
      entries,
    };
  }

  const total = entries.reduce(
    (sum, entry) => sum + entry.time_spent_minutes,
    0,
  );
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return {
    date,
    status: 'worked',
    worked_hours: `${hours}:${minutes}`,
    total_minutes: total,
    entries,
  };
}

/**
 * Itera de endDate até startDate (ordem decrescente, igual ao Go). Dias sem
 * apontamento em fins de semana são omitidos; feriados são SEMPRE omitidos,
 * mesmo que tenham apontamentos.
 */
export function classifyWorkdays(
  startDate: string,
  endDate: string,
  entriesByDate: Map<string, TaskEntryResponse[]>,
  holidayDates: Set<string>,
): WorkDayResponse[] {
  const start = parseDateStrict(startDate);
  const end = parseDateStrict(endDate);

  const result: WorkDayResponse[] = [];
  for (let d = end; d.getTime() >= start.getTime(); d = addUtcDays(d, -1)) {
    const dateStr = formatUtcDate(d);
    const dayEntries = entriesByDate.get(dateStr) ?? [];

    if (dayEntries.length === 0) {
      const weekday = d.getUTCDay(); // domingo=0 ... sábado=6
      if (weekday === 0 || weekday === 6) continue;
    }

    if (holidayDates.has(dateStr)) continue;

    result.push(buildWorkDay(dateStr, dayEntries));
  }

  return result;
}
