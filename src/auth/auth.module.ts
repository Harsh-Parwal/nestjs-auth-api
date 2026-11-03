import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import {JwtModule} from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService)=>({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {expiresIn: '3h'}
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
