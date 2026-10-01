import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, ParentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../database/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LookupStudentDto } from './dto/lookup-student.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedUser } from './auth.types';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<AuthenticatedUser> {
    // identifier is whatever the login form was given — an email or a phone number.
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
      include: { teacher: { select: { staffTitle: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      staffTitle: user.teacher?.staffTitle ?? null,
      portalAccess: user.portalAccess,
      accountStatus: user.accountStatus,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken: this.signToken(user),
      user,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: dto.role,
          portalAccess: [dto.role],
        },
      });

      switch (dto.role) {
        case Role.STUDENT:
          await tx.student.create({
            data: {
              userId: createdUser.id,
              admissionNo: this.generateCode('ADM'),
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
              gender: dto.gender ?? 'OTHER',
              classId: dto.classId,
              academicYear: dto.academicYear ?? new Date().getFullYear().toString(),
            },
          });
          break;
        case Role.TEACHER:
          await tx.teacher.create({
            data: {
              userId: createdUser.id,
              employeeNo: this.generateCode('EMP'),
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
              gender: dto.gender ?? 'OTHER',
            },
          });
          break;
        case Role.PARENT:
          // Admin-created parents are trusted immediately — the approval workflow only applies
          // to the public self-registration path (registerParent()).
          await tx.parent.create({ data: { userId: createdUser.id, status: ParentStatus.APPROVED } });
          break;
        case Role.ADMIN:
        case Role.SUPER_ADMIN:
          await tx.admin.create({ data: { userId: createdUser.id, permissions: [] } });
          break;
      }

      return createdUser;
    });

    return this.login({ email: user.email, password: dto.password });
  }

  async registerParent(dto: RegisterParentDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: Role.PARENT,
          portalAccess: [Role.PARENT],
          accountStatus: AccountStatus.PENDING,
          nickname: dto.nickname,
          jobTitle: dto.jobTitle,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          residenceLocationId: dto.residenceLocationId,
          workplaceLocationId: dto.workplaceLocationId,
        },
      });

      await tx.parent.create({
        data: {
          userId: createdUser.id,
          status: ParentStatus.PENDING,
          relationship: dto.relationship,
          occupation: dto.occupation,
          requestedStudentId: dto.requestedStudentId,
          claimedStudentName: dto.claimedStudentName,
          claimedAdmissionNo: dto.claimedAdmissionNo,
        },
      });

      return createdUser;
    });

    try {
      await this.mailService.sendParentRegistrationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
      );
    } catch {
      // Account creation must succeed even if the email provider is temporarily unavailable.
    }

    return this.login({ email: user.email, password: dto.password });
  }

  /**
   * Public "find your child" lookup for the parent registration wizard. Requires an exact
   * admission-number + last-name pair (a shared secret a real parent would have from school
   * paperwork) rather than a general name search, so this can't be used to browse student records.
   */
  async lookupStudent(dto: LookupStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: {
        admissionNo: dto.admissionNo,
        user: { lastName: { equals: dto.lastName, mode: 'insensitive' } },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { name: true } },
      },
    });

    if (!student) {
      return null;
    }

    return {
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      className: student.class?.name ?? null,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return genericResponse;
    }

    const { resetLink } = await this.createPasswordResetToken(user.id);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetLink);
    } catch {
      // Swallow: response stays generic regardless of email delivery outcome.
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.confirmPassword !== undefined && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('This reset link is invalid or has expired');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated. You can now log in.' };
  }

  async createPasswordResetToken(userId: string): Promise<{ resetLink: string }> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return { resetLink: `${frontendUrl}/auth/reset-password?token=${rawToken}` };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        nickname: true,
        jobTitle: true,
        dateOfBirth: true,
        accountStatus: true,
        portalAccess: true,
        residenceLocation: true,
        workplaceLocation: true,
        teacher: { select: { staffTitle: true, worksAtAnotherSchool: true, otherSchoolName: true } },
        parent: { select: { status: true, occupation: true, relationship: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { teacher, ...rest } = user;
    return {
      ...rest,
      staffTitle: teacher?.staffTitle ?? null,
      worksAtAnotherSchool: teacher?.worksAtAnotherSchool ?? false,
      otherSchoolName: teacher?.otherSchoolName ?? null,
    };
  }

  private signToken(user: AuthenticatedUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      portalAccess: user.portalAccess,
      accountStatus: user.accountStatus,
    });
  }

  private generateCode(prefix: string): string {
    const year = new Date().getFullYear();
    const suffix = randomInt(100000, 999999);
    return `${prefix}-${year}-${suffix}`;
  }
}
