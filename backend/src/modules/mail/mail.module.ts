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
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: Number(configService.get('SMTP_PORT', 587)),
          secure: false,
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_FROM', configService.getOrThrow<string>('SMTP_USER')),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
