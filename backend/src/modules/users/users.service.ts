import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  avatar: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { search?: string; role?: Role }) {
    const where: Prisma.UserWhereInput = {
      role: filters.role,
      OR: filters.search
        ? [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    return this.prisma.user.findMany({
      where,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, parent: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          nickname: dto.nickname,
          phone: dto.phone,
          jobTitle: dto.jobTitle,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          residenceLocationId: dto.residenceLocationId,
          workplaceLocationId: dto.workplaceLocationId,
        },
      });

      if (dto.teacher && user.teacher) {
        await tx.teacher.update({
          where: { userId },
          data: {
            worksAtAnotherSchool: dto.teacher.worksAtAnotherSchool,
            otherSchoolName: dto.teacher.otherSchoolName,
          },
        });
      }

      if (dto.parent && user.parent) {
        await tx.parent.update({
          where: { userId },
          data: {
            occupation: dto.parent.occupation,
            relationship: dto.parent.relationship,
            emergencyContact: dto.parent.emergencyContact,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nickname: true,
          phone: true,
          jobTitle: true,
          dateOfBirth: true,
          avatar: true,
          residenceLocation: true,
          workplaceLocation: true,
          teacher: { select: { staffTitle: true, worksAtAnotherSchool: true, otherSchoolName: true } },
          parent: { select: { occupation: true, relationship: true, emergencyContact: true, status: true } },
        },
      });
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  async grantRole(userId: string, role: typeof Role.TEACHER | typeof Role.PARENT) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, parent: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.portalAccess.includes(role)) {
      throw new BadRequestException(`This account already has ${role} portal access`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (role === Role.TEACHER && !user.teacher) {
        await tx.teacher.create({
          data: {
            userId,
            employeeNo: `EMP-${new Date().getFullYear()}-${randomInt(100000, 999999)}`,
            dateOfBirth: user.dateOfBirth ?? new Date(),
            gender: 'OTHER',
          },
        });
      }
      if (role === Role.PARENT && !user.parent) {
        await tx.parent.create({ data: { userId, status: 'APPROVED' } });
      }

      return tx.user.update({
        where: { id: userId },
        data: { portalAccess: { push: role } },
        select: SAFE_SELECT,
      });
    });
  }
}
