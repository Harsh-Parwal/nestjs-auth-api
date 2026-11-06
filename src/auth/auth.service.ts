import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { DatabaseService } from '../database/database.service.js';
import { MyLoggerService } from '../my-logger/my-logger.service.js';

import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService, private jwtService: JwtService) { }
  private readonly logger = new MyLoggerService(AuthService.name);

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

    this.logger.log(`New user signed up: id=${user.id}`);
    const { accessToken, refreshToken } = await this.generateToken(user.id);
    return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken };
  }


  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const existingUser = await this.databaseService.user.findUnique({ where: { email } });

    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: id=${existingUser.id}`);
    return this.generateToken(existingUser.id);
  }


  async getUserInfo(userId: number) {
    const existingUser = await this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true, name: true, email: true
      }
    });

    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }
    this.logger.log(`User id=${existingUser.id} accessed protected route /auth/me`);
    return existingUser;
  }


  async generateRefreshToken(refreshToken: string) {
    const existingToken = await this.databaseService.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expiryDate: { gte: new Date() }
      }
    });

    if (!existingToken) {
      // in this case frontend sends back user to login page to get brand new access and refresh token and then save the refresh token
      throw new UnauthorizedException('Refresh token is not valid or expired');
    }

    //  token is valid and not yet expired so first delete the older one
    await this.databaseService.refreshToken.delete({
      where: { id: existingToken.id }
    });

    this.logger.log(`Refresh token used: userId=${existingToken.userId}`)
    // generate the new tokens
    return await this.generateToken(existingToken.userId);
  }


  async generateToken(userId: number) {
    const payload = { userId };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, userId);
    return { accessToken, refreshToken };
  }


  async storeRefreshToken(token: string, userId: number) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    await this.databaseService.refreshToken.upsert({
      where: { userId },
      update: {
        token, expiryDate
      },
      create: {
        token, userId, expiryDate
      }
    })
  }
}
