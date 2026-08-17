import { IsOptional, IsString } from 'class-validator';

// Réplica de model.UpdateTaskSprintInput. Chave ausente, `null` e string
// vazia são TODAS tratadas como "desvincular" (diferente de assign, onde
// "" causa erro) — o handler Go filtra "" explicitamente antes de chamar
// o service.
export class UpdateTaskSprintDto {
  @IsOptional()
  @IsString()
  sprintId?: string | null;
}
