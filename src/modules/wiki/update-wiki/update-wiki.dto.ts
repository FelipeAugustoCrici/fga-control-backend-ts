import { IsArray, IsOptional, IsString } from 'class-validator';

// Réplica de model.UpdateWikiInput. sprintId: presente (mesmo null)
// desvincula/vincula; ausente não mexe — mesma semântica do **string do Go.
export class UpdateWikiDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  sprintId?: string | null;
}
