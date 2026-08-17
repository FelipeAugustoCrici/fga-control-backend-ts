import { omitEmpty } from '../../common/serialization/nullable';
import { UserRow } from './auth.repository';

// Réplica do model.User do Go: password_hash nunca é serializado
// (`json:"-"`). usage_type/plan_id/company_id/last_activity_at usam
// `,omitempty` no Go — a CHAVE some do JSON quando nula, não vira
// `null` — por isso são opcionais aqui e passadas por omitEmpty().
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
  is_admin: boolean;
  is_active: boolean;
  usage_type?: string;
  plan_id?: string;
  company_id?: string;
  last_activity_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export function toUserResponse(user: UserRow): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    must_change_password: user.must_change_password,
    is_admin: user.is_admin,
    is_active: user.is_active,
    usage_type: omitEmpty(user.usage_type),
    plan_id: omitEmpty(user.plan_id),
    company_id: omitEmpty(user.company_id),
    last_activity_at: omitEmpty(user.last_activity_at),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
