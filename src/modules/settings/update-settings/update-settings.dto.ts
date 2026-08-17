import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

// Réplica de model.UpdateSettingsInput. Só hourly_rate/daily_hours_goal
// exigem > 0 (binding:"required,gt=0") — monthly_goal é opcional, sem
// validação, default 0 quando ausente (float64 zero value no Go).
export class UpdateSettingsDto {
  @IsNumber()
  @IsPositive()
  hourly_rate!: number;

  @IsNumber()
  @IsPositive()
  daily_hours_goal!: number;

  @IsOptional()
  @IsNumber()
  monthly_goal?: number;

  @IsOptional()
  @IsString()
  default_category_name?: string;

  @IsOptional()
  @IsString()
  category_codes?: string;
}
