import { IsOptional, IsString } from 'class-validator';

// manager_user_id ausente/null remove o gestor direto do membro (fica sem
// hierarquia definida); string atribui.
export class UpdateMemberManagerDto {
  @IsOptional()
  @IsString()
  manager_user_id?: string | null;
}
