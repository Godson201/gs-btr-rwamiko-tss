import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get<string>('MAIL_ENABLED', 'true') === 'true';
        const provider = configService.get<string>('MAIL_PROVIDER', 'smtp').toLowerCase();
        const user = configService.get<string>('SMTP_USER', 'no-reply@localhost');
        return {
          // HTTP email providers do not use Nodemailer's transport. Keep a harmless
          // JSON transport registered so MailerService remains available for SMTP fallback.
          transport: enabled && provider === 'smtp'
            ? {
                host: configService.getOrThrow<string>('SMTP_HOST'),
                port: Number(configService.get('SMTP_PORT', 587)),
                secure: Number(configService.get('SMTP_PORT', 587)) === 465,
                auth: { user, pass: configService.getOrThrow<string>('SMTP_PASS') },
              }
            : { jsonTransport: true },
          defaults: { from: configService.get<string>('SMTP_FROM', user) },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
