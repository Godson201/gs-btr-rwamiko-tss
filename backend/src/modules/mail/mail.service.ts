import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendTeacherWelcomeEmail(
    to: string,
    name: string,
    tempPassword: string,
    resetLink: string,
  ): Promise<void> {
    await this.send(
      to,
      'Welcome to G.S BTR RWAMIKO TSS',
      `
        <p>Dear ${name},</p>
        <p>An account has been created for you on the G.S BTR RWAMIKO TSS School Management System.</p>
        <p>
          <strong>Username:</strong> ${to}<br/>
          <strong>Temporary password:</strong> ${tempPassword}
        </p>
        <p>For security, please change your password before you log in:</p>
        <p><a href="${resetLink}">Set your password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>— G.S BTR RWAMIKO TSS<br/>"Through Here, Wealth is Flash"</p>
      `,
    );
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
    await this.send(
      to,
      'Reset your G.S BTR RWAMIKO TSS password',
      `
        <p>Dear ${name},</p>
        <p>We received a request to reset your password. Click the link below to choose a new one:</p>
        <p><a href="${resetLink}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
        <p>— G.S BTR RWAMIKO TSS<br/>"Through Here, Wealth is Flash"</p>
      `,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({ to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }
}
