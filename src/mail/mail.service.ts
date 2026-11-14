import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private readonly resend: Resend;
    private readonly from: string;
    private readonly appUrl: string;

    constructor(config: ConfigService) {
        this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
        this.from = config.getOrThrow<string>('MAIL_FROM');
        this.appUrl = config.getOrThrow<string>('APP_URL');
    }

    async sendVerificationEmail(to: string, token: string) {
        const link = `${this.appUrl}/auth/verify-email?token=${token}`;

        const { error } = await this.resend.emails.send({
            from: this.from,
            to,
            subject: 'Verify your email',
            html: `<p>Click the link below to verify your email. It expires in 24 hours.</p>
             <p><a href="${link}">Verify email</a></p>`,
        });

        if (error) {
            throw new InternalServerErrorException('Could not send verification email');
        }
    }
}