// Réplica de PlanLimitService.CheckEntriesLimit/CheckProjectsLimit — 0 no
// limite significa ilimitado.
export function computeLimitCheck(
  limitValue: number,
  current: number,
): { canCreate: boolean; remaining: number } {
  if (limitValue === 0) {
    return { canCreate: true, remaining: 0 };
  }
  const canCreate = current < limitValue;
  const remaining = Math.max(limitValue - current, 0);
  return { canCreate, remaining };
}
