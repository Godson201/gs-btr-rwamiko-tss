import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
      portalAccess: true,
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
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim() || undefined;
    const qualification = dto.qualification?.trim() || undefined;
    const specialization = dto.specialization?.trim() || undefined;
    const departmentId = dto.departmentId?.trim() || undefined;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { email: true, phone: true },
    });
    if (existing) {
      throw new ConflictException(
        existing.email.toLowerCase() === email
          ? 'A user with this email already exists'
          : 'A user with this phone number already exists',
      );
    }

    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });
      if (!department) {
        throw new BadRequestException('Selected department does not exist');
      }
    }

    const temporaryPassword = dto.password ?? randomBytes(8).toString('hex');
    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    let teacher;
    try {
      teacher = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phone,
            role: 'TEACHER',
            portalAccess: ['TEACHER'],
          },
        });

        const teacherRole = await tx.schoolRole.findUnique({ where: { code: 'TEACHER' } });
        if (!teacherRole?.isActive) {
          throw new ConflictException('Teacher role configuration is unavailable');
        }
        await tx.userSchoolRole.create({
          data: {
            userId: user.id,
            schoolRoleId: teacherRole.id,
            source: 'LEGACY_PORTAL_ROLE',
          },
        });

        return tx.teacher.create({
          data: {
            userId: user.id,
            employeeNo: `EMP-${new Date().getFullYear()}-${randomInt(100000, 999999)}`,
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender,
            qualification,
            specialization,
            departmentId,
          },
          include: TEACHER_INCLUDE,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = String(error.meta?.target ?? '');
          if (target.includes('email')) {
            throw new ConflictException('A user with this email already exists');
          }
          if (target.includes('phone')) {
            throw new ConflictException('A user with this phone number already exists');
          }
          throw new ConflictException('A teacher with these details already exists');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('The selected department is invalid');
        }
      }
      throw error;
    }

    try {
      const { resetLink } = await this.authService.createPasswordResetToken(teacher.user.id);
      await this.mailService.sendTeacherWelcomeEmail(
        email,
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
          staffTitle: dto.staffTitle,
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
