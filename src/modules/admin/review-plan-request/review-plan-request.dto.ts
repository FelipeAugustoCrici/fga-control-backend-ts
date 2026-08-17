import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Réplica de model.ReviewPlanRequestInput (`binding:"required,oneof=approved rejected"`).
export class ReviewPlanRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['approved', 'rejected'])
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
