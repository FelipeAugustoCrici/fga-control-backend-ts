import { IsOptional, IsString } from 'class-validator';

// @IsOptional() (sem @IsNotEmpty) de propósito: o ValidationPipe global usa
// whitelist:true, que remove qualquer propriedade sem NENHUM decorator. A
// checagem de obrigatoriedade é manual no controller, para replicar a
// mensagem fixa do Go ("plan_id é obrigatório"), que ignora a mensagem real
// do bind error.
export class UpdateUserPlanDto {
  @IsOptional()
  @IsString()
  plan_id?: string;
}
