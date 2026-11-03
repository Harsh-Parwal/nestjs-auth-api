import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupData: SignupAuthDto){
    return this.authService.signup(signupData);
  }

  @Post('login')
  async login(@Body() loginData: LoginAuthDto){
    return this.authService.login(loginData);
  }
  
}
