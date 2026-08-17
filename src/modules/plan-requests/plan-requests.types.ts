// Réplica de model.PlanRequest — SEM omitempty em nenhum campo (diferente
// da maioria dos outros modelos). O INSERT...RETURNING do Go só preenche
// id/user_id/current_plan_id/requested_plan_id/status/note/reviewed_by/
// reviewed_at/created_at — user_name, user_email e requested_plan_name
// ficam com o zero-value ("") e current_plan_name fica null, porque a
// query de criação não faz JOIN com users/plans. Replicado igual aqui.
export interface PlanRequestResponse {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  current_plan_id: string | null;
  current_plan_name: string | null;
  requested_plan_id: string;
  requested_plan_name: string;
  status: string;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}
