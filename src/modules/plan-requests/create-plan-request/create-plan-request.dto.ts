import { IsOptional, IsString } from 'class-validator';

// @IsOptional() (sem @IsNotEmpty) é proposital: o ValidationPipe global usa
// whitelist:true, que remove qualquer propriedade SEM decorator algum — sem
// isto, requested_plan_id sumiria antes de chegar no controller. A checagem
// de obrigatoriedade é manual lá, para replicar a mensagem customizada do Go
// ("requested_plan_id é obrigatório"), diferente da mensagem genérica do
// ValidationPipe.
export class CreatePlanRequestDto {
  @IsOptional()
  @IsString()
  requested_plan_id?: string;
}
