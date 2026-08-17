// Helpers de data local (não UTC) usados pelos atalhos de período de
// entries/dashboard/reports — precisam da mesma TZ configurada no processo
// Go (America/Sao_Paulo) para calcular os mesmos limites de dia/semana/mês.
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localToday(): string {
  return formatLocalDate(new Date());
}

export function localWeekRange(): { start: string; end: string } {
  const now = new Date();
  let weekday = now.getDay();
  if (weekday === 0) weekday = 7;
  const monday = addLocalDays(now, -(weekday - 1));
  const sunday = addLocalDays(monday, 6);
  return { start: formatLocalDate(monday), end: formatLocalDate(sunday) };
}

export function localMonthRange(): { start: string; end: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatLocalDate(first), end: formatLocalDate(last) };
}

function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
