import { company_role } from '../../generated/prisma/enums';

// Réplica de model.Company — team_size tem omitempty.
export interface CompanyResponse {
  id: string;
  name: string;
  owner_id: string;
  team_size?: string;
  created_at: Date;
  updated_at: Date;
}

// Réplica de model.UserCompany (GET /companies/me).
export interface UserCompanyResponse {
  id: string;
  name: string;
  role: company_role;
}

// Réplica de model.CompanyMember (GET /companies/members), com o campo de
// hierarquia adicionado (quem é o gestor direto desse membro).
export interface CompanyMemberResponse {
  id: string;
  company_id: string;
  user_id: string;
  role: company_role;
  created_at: Date;
  name: string;
  email: string;
  total_minutes: number;
  manager_user_id?: string;
  manager_name?: string;
}

export interface MembershipInfo {
  isMember: boolean;
  role: company_role | null;
  managerUserId: string | null;
}
