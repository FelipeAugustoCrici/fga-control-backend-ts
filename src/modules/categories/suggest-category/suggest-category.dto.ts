import { IsString } from 'class-validator';

export class SuggestCategoryDto {
  @IsString()
  code!: string;
}
