import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled =
      this.configService
        .get<string>('SEED_ADMIN_RESET_PASSWORD', 'false')
        .trim()
        .toLowerCase() === 'true';

    if (!enabled) {
      this.logger.log('Administrator password recovery is disabled');
      return;
    }

    const email = this.configService.get<string>('SEED_ADMIN_EMAIL')?.trim();
    const password = this.configService.get<string>('SEED_ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.error(
        'Administrator recovery is enabled, but SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing',
      );
      return;
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: {
          password: hashedPassword,
          isActive: true,
          role: 'SUPER_ADMIN',
          portalAccess: ['SUPER_ADMIN'],
          accountStatus: 'ACTIVE',
        },
        create: {
          email,
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'SUPER_ADMIN',
          portalAccess: ['SUPER_ADMIN'],
          accountStatus: 'ACTIVE',
        },
      });

      await tx.admin.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, position: 'System Administrator', permissions: [] },
      });
    });

    this.logger.warn(`Administrator password recovered for ${email}; disable recovery now`);
  }
}
