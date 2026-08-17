import { IsString } from 'class-validator';

// Réplica de model.CreateHolidayInput (user_id é preenchido pelo handler).
export class CreateHolidayDto {
  @IsString()
  date!: string;

  @IsString()
  name!: string;
}
