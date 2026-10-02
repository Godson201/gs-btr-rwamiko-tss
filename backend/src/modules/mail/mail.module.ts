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
        const configuredUser = configService.get<string>('SMTP_USER');
        const user = configuredUser || 'no-reply@localhost';
        const host = configService.get<string>('SMTP_HOST');
        const password = configService.get<string>('SMTP_PASS');
        const smtpConfigured = Boolean(host && configuredUser && password);
        return {
          // Keep SMTP ready as a fallback when an HTTP provider is unavailable.
          transport: enabled && smtpConfigured
            ? {
                host,
                port: Number(configService.get('SMTP_PORT', 587)),
                secure: Number(configService.get('SMTP_PORT', 587)) === 465,
                auth: { user, pass: password },
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
