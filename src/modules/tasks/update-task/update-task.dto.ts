import { IsNumber, IsOptional, IsString } from 'class-validator';

// Réplica de model.UpdateTaskInput — sem validação de tamanho/enum (o Go
// não valida nada aqui além do binding JSON). sprintId/projectId/dueDate
// tratam "" como "limpar vínculo" (ver tasks.repository.ts); assignedUserId
// NÃO trata "" especialmente (réplica de um bug real do Go: "" vira erro
// de banco/500, não um "desvincular").
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
