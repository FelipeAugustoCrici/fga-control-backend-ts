import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Réplica de model.CreateTaskEntryInput. hourly_rate não é obrigatório no Go
// (float64 não-ponteiro, binding só exige min=0) — default 0 quando ausente.
export class CreateEntryDto {
  @IsOptional()
  @IsString()
  target_user_id?: string;

  @IsOptional()
  @IsString()
  task_id?: string;

  @IsString()
  date!: string;

  @IsString()
  task_code!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  time_spent_minutes!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsString()
  status!: string;

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
