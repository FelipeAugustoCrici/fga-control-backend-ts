// Janela de retroatividade pra lançamentos de EMPLOYEE em workspace de
// empresa: pode lançar/editar livremente até N dias atrás; mais antigo que
// isso só ADMIN/MANAGER ajusta (ex: esqueceu de lançar na sexta, lembra na
// segunda — ainda cabe; um buraco de um mês não).
export const RETROACTIVE_WINDOW_DAYS = 7;

/** true se `date` (YYYY-MM-DD) está mais de `windowDays` dias no passado. */
export function isBeyondRetroactiveWindow(
  date: string,
  windowDays: number = RETROACTIVE_WINDOW_DAYS,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays > windowDays;
}
