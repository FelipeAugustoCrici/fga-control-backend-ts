import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { dataResponse } from '../../../common/http/response.util';
import { LoginDto } from './login.dto';
import { LoginService } from './login.service';

@Controller('api/v1/auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.loginService.execute(dto);
    return dataResponse(result);
  }
}
