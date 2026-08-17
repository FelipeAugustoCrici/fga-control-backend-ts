import { IsEmail, IsString } from 'class-validator';

import { company_role } from '../../../generated/prisma/enums';

// Réplica de model.InviteMemberInput. O Go só exige "required" no role, sem
// validar contra o enum ADMIN|MANAGER|EMPLOYEE — um valor inválido só falha
// mais tarde na constraint do Postgres (vira 500 genérico). Mantido
// igualmente permissivo aqui, como em create-user.dto.ts.
export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  role!: company_role;
}
