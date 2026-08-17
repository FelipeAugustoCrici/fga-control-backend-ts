import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Réplica de model.RegisterInput (internal/model/auth.go). Casing e
// obrigatoriedade seguem exatamente as tags `binding` do Go — não inventar
// validação extra (ex: usage_type não é restrito a um enum no Go).
export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  invite_code?: string;

  @IsOptional()
  @IsString()
  usage_type?: string;

  @IsOptional()
  @IsString()
  plan_id?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  team_size?: string;
}
