import { IsNotEmpty, IsString } from 'class-validator';

// Réplica de model.UpdateTaskStatusInput — status é required, sem
// validação de enum (a coluna é VARCHAR livre, não um enum do Postgres).
export class UpdateTaskStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}
