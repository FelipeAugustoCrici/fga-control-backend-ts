import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

/**
 * Falha o boot do processo se variáveis obrigatórias estiverem ausentes —
 * equivalente ao fail-fast do main() em Go, mas sem o fallback inseguro
 * que internal/auth/jwt.go usa para JWT_SECRET ("change-me-in-production").
 */
class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production'])
  APP_ENV?: string;

  @IsOptional()
  @IsString()
  APP_PORT?: string;

  @IsNotEmpty({ message: 'DATABASE_URL não definida' })
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty({ message: 'JWT_SECRET não definida' })
  @IsString()
  JWT_SECRET!: string;

  @IsNotEmpty({ message: 'FIELD_ENCRYPT_KEY não definida' })
  @IsString()
  FIELD_ENCRYPT_KEY!: string;

  @IsOptional()
  @IsString()
  ALLOWED_ORIGINS?: string;

  // URL interna do backend Go, usada apenas pelo proxy strangler-fig
  // enquanto slices ainda não migrados existem. Removido no corte final.
  @IsOptional()
  @IsString()
  GO_BACKEND_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .flatMap((err) => Object.values(err.constraints ?? {}))
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${messages}`);
  }

  return validated;
}
