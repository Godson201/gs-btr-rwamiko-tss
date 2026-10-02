import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

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

  async sendParentRegistrationEmail(to: string, name: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.send(
      to,
      'Your G.S BTR RWAMIKO TSS parent account was created',
      `
        <p>Dear ${name},</p>
        <p>Your parent account on the G.S BTR RWAMIKO TSS School Management System was created successfully.</p>
        <p>Your request is now awaiting review by the school administration. You will receive access after it is approved.</p>
        <p><a href="${frontendUrl}/auth/login">Open the school portal</a></p>
        <p>G.S BTR RWAMIKO TSS<br/>"Through Here, Wealth is Flash"</p>
      `,
    );
  }

  async sendResponsibilityChangedEmail(
    to: string,
    name: string,
    responsibility: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.send(
      to,
      `Your school responsibility is now ${responsibility}`,
      `
        <p>Dear ${this.escapeHtml(name)},</p>
        <p>Your responsibility in the G.S BTR RWAMIKO TSS School Management System has been changed.</p>
        <p><strong>New responsibility:</strong> ${this.escapeHtml(responsibility)}</p>
        <p>Your dashboard will now show the tools and information for this responsibility.</p>
        <p><a href="${this.escapeHtml(frontendUrl)}/auth/login">Open the school portal</a></p>
        <p>If you believe this change is incorrect, please contact the school administration.</p>
        <p>G.S BTR RWAMIKO TSS<br/>"Through Here, Wealth is Flash"</p>
      `,
    );
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    })[character]!);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.configService.get<string>('MAIL_ENABLED', 'true') !== 'true') {
      this.logger.warn(`Email delivery is disabled; skipped message to ${to}`);
      throw new Error('Email delivery is disabled');
    }
    try {
      const provider = this.configService.get<string>('MAIL_PROVIDER', 'smtp').toLowerCase();
      if (provider === 'brevo') {
        try {
          await this.sendWithBrevo(to, subject, html);
        } catch (brevoError) {
          if (!this.hasSmtpFallback()) throw brevoError;
          this.logger.warn(`Brevo delivery failed; retrying ${to} through configured SMTP`);
          await this.mailerService.sendMail({ to, subject, html });
        }
      } else {
        await this.mailerService.sendMail({ to, subject, html });
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  private hasSmtpFallback(): boolean {
    return Boolean(
      this.configService.get<string>('SMTP_HOST') &&
      this.configService.get<string>('SMTP_USER') &&
      this.configService.get<string>('SMTP_PASS'),
    );
  }

  private async sendWithBrevo(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.configService.getOrThrow<string>('BREVO_API_KEY');
    const senderEmail = this.configService.getOrThrow<string>('MAIL_FROM_EMAIL');
    const senderName = this.configService.get<string>('MAIL_FROM_NAME', 'G.S BTR RWAMIKO TSS');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Brevo rejected the email (${response.status}): ${details.slice(0, 500)}`);
    }
  }
}
