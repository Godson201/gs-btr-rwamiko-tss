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
        const user = configService.get<string>('SMTP_USER', 'no-reply@localhost');
        return {
          transport: enabled
            ? {
                host: configService.getOrThrow<string>('SMTP_HOST'),
                port: Number(configService.get('SMTP_PORT', 587)),
                secure: false,
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
