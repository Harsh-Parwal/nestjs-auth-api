import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,  // reject expired token
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    //   Passport calls this only after the signature and expiry checks pass
    validate(payload: { userId: number }) {
        return { userId: payload.userId };
    }
}