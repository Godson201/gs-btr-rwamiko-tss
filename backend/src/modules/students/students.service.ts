import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const STUDENT_INCLUDE = {
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
  class: { select: { id: true, name: true, level: true, section: true } },
} satisfies Prisma.StudentInclude;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(params: { search?: string; classId?: string; page?: number; pageSize?: number }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;

    const where: Prisma.StudentWhereInput = {
      classId: params.classId,
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
      this.prisma.student.findMany({
        where,
        include: STUDENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: STUDENT_INCLUDE,
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async create(dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'STUDENT',
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          admissionNo: `ADM-${new Date().getFullYear()}-${randomInt(100000, 999999)}`,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          address: dto.address,
          classId: dto.classId,
          academicYear: dto.academicYear,
        },
        include: STUDENT_INCLUDE,
      });
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.firstName || dto.lastName || dto.phone !== undefined || dto.isActive !== undefined) {
        await tx.user.update({
          where: { id: student.user.id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            isActive: dto.isActive,
          },
        });
      }

      return tx.student.update({
        where: { id },
        data: {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          address: dto.address,
          classId: dto.classId,
          academicYear: dto.academicYear,
          isGraduated: dto.isGraduated,
        },
        include: STUDENT_INCLUDE,
      });
    });
  }

  async remove(id: string) {
    const student = await this.findOne(id);
    await this.prisma.user.delete({ where: { id: student.user.id } });
    return { success: true };
  }
}
