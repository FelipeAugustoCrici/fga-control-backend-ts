/**
 * Formata uma coluna Postgres `DATE` (Prisma retorna como Date em UTC
 * meia-noite) como "YYYY-MM-DD", replicando o `date::text` que o Go usa
 * em toda query que expõe uma coluna DATE (holidays.date, task_entries.date,
 * sprints.start_date/end_date etc).
 */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
