import { IsInt, IsOptional, Min } from 'class-validator';

// Corpo é opcional no Go (bind é ignorado se ausente/inválido) — initial_seconds
// só precisa ser >= 0 quando presente.
export class StartTimerDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  initial_seconds?: number;
}
