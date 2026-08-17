import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Réplica de model.CreateSprintInput.
export class CreateSprintDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;
}
