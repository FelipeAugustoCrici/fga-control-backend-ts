import { IsString } from 'class-validator';

// Réplica de model.UpdatePlanInput.
export class UpdatePlanDto {
  @IsString()
  plan_id!: string;
}
