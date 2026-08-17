/**
 * Converte null em undefined para replicar `json:"campo,omitempty"` do Go
 * em ponteiros nil: `JSON.stringify` omite chaves com valor `undefined`,
 * mas SERIALIZA chaves com valor `null` — então um mapper que apenas
 * repassasse `null` produziria `{"campo": null}` onde o Go produziria
 * `{}` (chave ausente). Descoberto comparando /auth/me lado a lado com o
 * backend Go real: usage_type/plan_id/company_id/last_activity_at nulos
 * são omitidos por lá, não serializados como null.
 */
export function omitEmpty<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/**
 * Igual a omitEmpty, mas para campos numéricos com `omitempty` em cima de
 * um `int` (não ponteiro) no Go — nesse caso o zero-value (0) TAMBÉM é
 * tratado como "vazio" e a chave é omitida (não só null/ausente). Usado em
 * model.Sprint (TotalTasks/DoneTasks/InProgressTasks/TodoTasks), onde uma
 * sprint sem tasks omite essas chaves inteiramente em vez de mandar 0.
 */
export function omitZero(value: number | null | undefined): number | undefined {
  return value ? value : undefined;
}
