import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Réplica de model.CreateUserInput. O Go não valida "role" contra o enum
// ADMIN|MANAGER|EMPLOYEE no binding — um valor inválido só falha mais
// tarde, na constraint de enum do Postgres (vira 500 genérico). Mantido
// igualmente permissivo aqui.
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  role?: string;

  // Gestor direto do novo usuário (hierarquia de reporte). Não existia no
  // Go — adicionado aqui, validado no service (precisa ser ADMIN/MANAGER
  // da mesma empresa).
  @IsOptional()
  @IsString()
  manager_user_id?: string;
}
