import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupAuthDto } from './dto/signup-auth.dto.js';
import { DatabaseService } from '../database/database.service.js';
import { MyLoggerService } from '../my-logger/my-logger.service.js';
import { MailService } from '../mail/mail.service.js';

import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'crypto';

// 24 hours is the expiry time to verify user
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService, private jwtService: JwtService, private mailService: MailService) { }
  private readonly logger = new MyLoggerService(AuthService.name);

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }
  private async createVerificationToken(userId: number) {
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    // store the hashed token to compare later with token(we later hash) from the link
    await this.databaseService.emailVerificationToken.upsert({
      where: { userId },
      update: { tokenHash: hashedToken, expiresAt },
      create: { userId, tokenHash: hashedToken, expiresAt }
    });
    return rawToken;
  }


  async signup(signupData: SignupAuthDto) {
    const { name, email, password } = signupData;
    const existingUser = await this.databaseService.user.findUnique({
      where: { email }
    });

    // if the user exists and his email is verified 
    if (existingUser && existingUser.emailVerified) {
      throw new ConflictException('Email already in use. Try logging in or use Google sign-in.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // handling the other 2 cases when he can be an existing user but unverified or a completely new user
    const user = existingUser
      ? await this.databaseService.user.update({
        where: { id: existingUser.id },
        data: { name, password: hashedPassword },
      })
      : await this.databaseService.user.create({
        data: { name, email, password: hashedPassword },
      });

    const rawVerificationToken = await this.createVerificationToken(user.id);
    // pass the token to mailService to verify the email
    await this.mailService.sendVerificationEmail(user.email, rawVerificationToken);

    this.logger.log(`Verification email sent: userId=${user.id}`);
    return { message: 'Check your email to verify your account' };
  }


  async verifyEmail(rawToken: string) {
    const hashedToken = this.hashToken(rawToken);
    const existingToken = await this.databaseService.emailVerificationToken.findUnique({ where: { tokenHash: hashedToken } });
    if (!existingToken || new Date() > existingToken.expiresAt) {
      throw new BadRequestException('Verification link is invalid or has expired');
    }

    // both changes succeed together or neither happens(update the user's email to be verified and delete it's emailVerification token)
    await this.databaseService.$transaction([
      this.databaseService.user.update({
        where: { id: existingToken.userId },
        data: { emailVerified: true },
      }),
      this.databaseService.emailVerificationToken.delete({
        where: { id: existingToken.id }
      }),
    ])

    this.logger.log(`Email verified: userId=${existingToken.userId}`);
    return { message: 'Email verified. You can login now.' };
  }


  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const existingUser = await this.databaseService.user.findUnique({ where: { email } });

    if (!existingUser || !existingUser.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!existingUser.emailVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    this.logger.log(`User logged in: id=${existingUser.id}`);
    const { accessToken, refreshToken } = await this.generateToken(existingUser.id);
    return { user: { id: existingUser.id, name: existingUser.name, email: existingUser.email }, accessToken, refreshToken };
  }


  async generateRefreshToken(refreshToken: string) {
    const existingToken = await this.databaseService.refreshToken.findUnique({
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


  async googleLogin(googleUser: { googleId: string; email: string; name: string; emailVerified: boolean }) {
    const { googleId, email, name, emailVerified } = googleUser;
    let user = await this.databaseService.user.findUnique({ where: { googleId } });

    if (!user) {
      // Google must vouch for the email before we create or link anything
      if (!emailVerified) {
        throw new UnauthorizedException('Google email is not verified');
      }

      const existingUser = await this.databaseService.user.findUnique({ where: { email } });
      // brand new user: Google already verified the email - signup
      if (!existingUser) {
        user = await this.databaseService.user.create({
          data: { name, email, googleId, emailVerified: true },
        });
      }
      else {
        if (existingUser.googleId) {
          throw new ConflictException('Email is already linked to another Google account');
        }

        // verified credentials account: link, and keep the password so both logins work
        if (existingUser.emailVerified) {
          user = await this.databaseService.user.update({
            where: { id: existingUser.id },
            data: { googleId },
          });
        }
        else {
          // unverified credentials account: whoever set that password never proved they own the email,
          // so mark the account verified, drop the password, and remove the pending token
          const [updatedUser] = await this.databaseService.$transaction([
            this.databaseService.user.update({
              where: { id: existingUser.id },
              data: { googleId, emailVerified: true, password: null },
            }),
            this.databaseService.emailVerificationToken.deleteMany({
              where: { userId: existingUser.id },
            }),
          ]);
          user = updatedUser;
        }
      }
    }

    this.logger.log(`User logged in with Google: id=${user.id}`);
    const { accessToken, refreshToken } = await this.generateToken(user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, refreshToken, accessToken };
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
