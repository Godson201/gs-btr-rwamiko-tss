import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
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
          await tx.parent.create({ data: { userId: createdUser.id } });
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
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private signToken(user: AuthenticatedUser): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  private generateCode(prefix: string): string {
    const year = new Date().getFullYear();
    const suffix = randomInt(100000, 999999);
    return `${prefix}-${year}-${suffix}`;
  }
}
