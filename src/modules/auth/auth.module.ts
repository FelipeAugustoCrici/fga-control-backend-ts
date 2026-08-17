import { Module } from '@nestjs/common';

import { CompaniesModule } from '../companies/companies.module';
import { AuthTokenIssuerService } from './auth-token-issuer.service';
import { AuthRepository } from './auth.repository';
import { ChangePasswordController } from './change-password/change-password.controller';
import { ChangePasswordService } from './change-password/change-password.service';
import { CreateUserController } from './create-user/create-user.controller';
import { CreateUserService } from './create-user/create-user.service';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { LogoutController } from './logout/logout.controller';
import { LogoutService } from './logout/logout.service';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { RegisterController } from './register/register.controller';
import { RegisterService } from './register/register.service';
import { UpdatePlanController } from './update-plan/update-plan.controller';
import { UpdatePlanService } from './update-plan/update-plan.service';

@Module({
  imports: [CompaniesModule],
  controllers: [
    RegisterController,
    LoginController,
    LogoutController,
    MeController,
    ChangePasswordController,
    UpdatePlanController,
    CreateUserController,
  ],
  providers: [
    AuthRepository,
    AuthTokenIssuerService,
    RegisterService,
    LoginService,
    LogoutService,
    MeService,
    ChangePasswordService,
    UpdatePlanService,
    CreateUserService,
  ],
  // AuthRepository é usado por outros slices (ex: plans/get-my-permissions,
  // que precisa do plan_id do usuário no contexto pessoal).
  exports: [AuthRepository],
})
export class AuthModule {}
