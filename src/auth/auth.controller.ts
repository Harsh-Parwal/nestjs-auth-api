import { Controller, Post, Body, Get, Req, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto.js';
import { Public } from './decorators/public.decorator.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { VerifyEmailAuthDto } from './dto/verify-email-auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  async signup(@Body() signupData: SignupAuthDto) {
    return this.authService.signup(signupData);
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query() verifyEmailData: VerifyEmailAuthDto) {
    return this.authService.verifyEmail(verifyEmailData.token);
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

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() { }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: { user: { googleId: string, email: string, name: string, emailVerified: boolean } }) {
    return this.authService.googleLogin(req.user);
  }

  @Get('me')
  async getUserInfo(@Req() req: { user: { userId: number } }) {
    return this.authService.getUserInfo(req.user.userId);
  }
}
