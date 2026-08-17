import { IsBoolean, IsOptional, IsString } from 'class-validator';

// Réplica de model.CreateCategoryInput.
export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  color!: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;
}
