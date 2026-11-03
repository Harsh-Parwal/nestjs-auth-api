import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { DatabaseService } from '../database/database.service.js';

import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService, private jwtService: JwtService) { }

  async signup(signupData: SignupAuthDto) {
    const { name, email, password } = signupData;
    const existingUser = await this.databaseService.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.databaseService.user.create({
      data: {
        email, name, password: hashedPassword
      }
    });

    const {accessToken}=await this.generateToken(user.id, email);
    return {user, accessToken};
  }

  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const exisitingUser = await this.databaseService.user.findUnique({ where: { email } });

    if (!exisitingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, exisitingUser.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(exisitingUser.id, email);
  }

  async generateToken(userId: number, email: string) {
    const payload = { userId, email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
