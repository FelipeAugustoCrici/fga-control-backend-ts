// Réplica de model.Holiday. No Go, date e created_at vêm de `::text` cast
// no Postgres — created_at fica no formato nativo do Postgres
// ("YYYY-MM-DD HH:MI:SS+TZ"), não RFC3339. Aqui usamos ISO 8601
// (toISOString()) como desvio consciente e documentado: ambos os formatos
// são interpretáveis por `new Date(...)`, e created_at de feriado não é
// exibido cru na UI.
export interface HolidayResponse {
  id: string;
  date: string;
  name: string;
  user_id?: string;
  created_at: string;
}
