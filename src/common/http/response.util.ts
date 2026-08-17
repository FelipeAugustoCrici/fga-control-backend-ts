/**
 * Helpers para as convenções de resposta observadas no Go (por convenção,
 * não por tipo compartilhado): {"data": ...} para leitura, {"message": ...}
 * para mutação sem payload, paginação com total/page/per_page como irmãos
 * de "data". O Nest já define o status HTTP certo por padrão (200 leitura,
 * 201 POST) — use @HttpCode() nos casos que fogem disso.
 */
export function dataResponse<T>(data: T): { data: T } {
  return { data };
}

export function messageResponse(
  message: string,
  extra: Record<string, unknown> = {},
): { message: string } & Record<string, unknown> {
  return { message, ...extra };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): { data: T[]; total: number; page: number; per_page: number } {
  return { data, total, page, per_page: perPage };
}

// {"data": ..., "total": ...} sem page/per_page — usado por endpoints como
// GET /workdays e GET /entries que só devolvem a contagem, sem paginação.
export function dataWithTotalResponse<T>(
  data: T[],
  total: number,
): { data: T[]; total: number } {
  return { data, total };
}
