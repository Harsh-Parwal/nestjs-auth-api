import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  async signup(@Body() signupData: SignupAuthDto) {
    return this.authService.signup(signupData);
  }

  @Public()
  @Post('login')
  async login(@Body() loginData: LoginAuthDto) {
    return this.authService.login(loginData);
  }

  @Public()
  @Post('refresh')
  async generateRefreshToken(@Body() refreshTokenData: RefreshTokenAuthDto) {
    return this.authService.generateRefreshToken(refreshTokenData.refreshToken);
  }

  @Get('me')
  async getUserInfo(@Req() req: { user: { userId: number } }) {
    return this.authService.getUserInfo(req.user.userId);
  }
}
