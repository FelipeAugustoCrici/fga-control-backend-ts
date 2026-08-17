import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

// Réplica de model.UpdateTaskEntryInput — tudo opcional, sem constraints no
// Go (nenhuma tag `binding`). task_id: "" desvincula, ausente não mexe.
export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  task_id?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  task_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  time_spent_minutes?: number;

  @IsOptional()
  @IsNumber()
  hourly_rate?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;
}
