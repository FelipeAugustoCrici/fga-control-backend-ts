import { IsOptional, IsString } from 'class-validator';

// Réplica de model.UpdateTaskAssignInput. Chave ausente e `null` explícito
// são indistinguíveis no Go (ambos = "desvincular"). Uma string vazia
// NÃO é tratada como "desvincular" aqui (diferente de sprintId) — é escrita
// como está e quebra a constraint de UUID no banco, réplica de um bug real
// do Go (vira 500, não 400).
export class UpdateTaskAssignDto {
  @IsOptional()
  @IsString()
  assignedUserId?: string | null;
}
