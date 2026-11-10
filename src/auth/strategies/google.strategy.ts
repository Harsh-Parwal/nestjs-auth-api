import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20"


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(config: ConfigService) {
        super({
            clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    validate(_googleAccessToken: string, _googleRefreshToken: string, profile: Profile) {
        const email = profile.emails?.[0]?.value;
        const emailVerified = profile.emails?.[0]?.verified ?? false;

        if (!email) {
            throw new UnauthorizedException('Google account has no email');
        }

        return { googleId: profile.id, email, name: profile.displayName, emailVerified };
    }
}