import { IsEmail, IsString } from 'class-validator';

// Réplica de model.LoginInput.
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
