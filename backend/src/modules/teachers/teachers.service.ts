import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

const TEACHER_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
    },
  },
  department: { select: { id: true, name: true, code: true } },
} satisfies Prisma.TeacherInclude;

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async findAll(params: { search?: string; departmentId?: string; page?: number; pageSize?: number }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;

    const where: Prisma.TeacherWhereInput = {
      departmentId: params.departmentId,
      user: params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        include: TEACHER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: TEACHER_INCLUDE,
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const temporaryPassword = dto.password ?? randomBytes(8).toString('hex');
    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    const teacher = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'TEACHER',
        },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          employeeNo: `EMP-${new Date().getFullYear()}-${randomInt(100000, 999999)}`,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          qualification: dto.qualification,
          specialization: dto.specialization,
          departmentId: dto.departmentId,
        },
        include: TEACHER_INCLUDE,
      });
    });

    try {
      const { resetLink } = await this.authService.createPasswordResetToken(teacher.user.id);
      await this.mailService.sendTeacherWelcomeEmail(
        dto.email,
        `${dto.firstName} ${dto.lastName}`,
        temporaryPassword,
        resetLink,
      );
    } catch (error) {
      this.logger.error(
        `Teacher ${teacher.id} created but the welcome email failed to send: ${(error as Error).message}`,
      );
    }

    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.firstName || dto.lastName || dto.phone !== undefined || dto.isActive !== undefined) {
        await tx.user.update({
          where: { id: teacher.user.id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            isActive: dto.isActive,
          },
        });
      }

      return tx.teacher.update({
        where: { id },
        data: {
          gender: dto.gender,
          qualification: dto.qualification,
          specialization: dto.specialization,
          departmentId: dto.departmentId,
        },
        include: TEACHER_INCLUDE,
      });
    });
  }

  async remove(id: string) {
    const teacher = await this.findOne(id);
    await this.prisma.user.delete({ where: { id: teacher.user.id } });
    return { success: true };
  }

  async findMyAssignments(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.prisma.classSubject.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: { select: { id: true, name: true, level: true, section: true } },
        subject: { select: { id: true, code: true, name: true, credits: true, learningHours: true } },
      },
      orderBy: { class: { name: 'asc' } },
    });
  }
}
