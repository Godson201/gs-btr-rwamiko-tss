import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AssignModuleDto } from './dto/assign-module.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AcademicScopeService } from '../rbac/academic-scope.service';

const ASSIGNMENT_INCLUDE = {
  subject: { select: { id: true, code: true, name: true, credits: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ClassSubjectInclude;

@Injectable()
export class ClassModulesService {
  constructor(private readonly prisma: PrismaService, private readonly scope: AcademicScopeService) {}

  async findAllForUser(userId: string, classId: string) {
    const classScope = await this.scope.classWhere(userId, 'academic.curriculum.view');
    const accessibleClass = await this.prisma.class.findFirst({
      where: { AND: [{ id: classId }, classScope] },
      select: { id: true },
    });
    if (!accessibleClass) throw new NotFoundException('Class not found');
    return this.prisma.classSubject.findMany({
      where: await this.scope.classSubjectWhere(userId, classId, 'academic.curriculum.view'),
      include: ASSIGNMENT_INCLUDE,
      orderBy: { subject: { code: 'asc' } },
    });
  }

  findAll(classId: string) {
    return this.prisma.classSubject.findMany({
      where: { classId },
      include: ASSIGNMENT_INCLUDE,
      orderBy: { subject: { code: 'asc' } },
    });
  }

  async assign(classId: string, dto: AssignModuleDto) {
    try {
      return await this.prisma.classSubject.create({
        data: { classId, subjectId: dto.subjectId, teacherId: dto.teacherId },
        include: ASSIGNMENT_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This module is already assigned to this class');
      }
      throw error;
    }
  }

  async update(classId: string, id: string, dto: UpdateAssignmentDto) {
    await this.findAssignmentOrThrow(classId, id);
    return this.prisma.classSubject.update({
      where: { id },
      data: { teacherId: dto.teacherId },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async remove(classId: string, id: string) {
    await this.findAssignmentOrThrow(classId, id);
    await this.prisma.classSubject.delete({ where: { id } });
    return { success: true };
  }

  private async findAssignmentOrThrow(classId: string, id: string) {
    const assignment = await this.prisma.classSubject.findUnique({ where: { id } });
    if (!assignment || assignment.classId !== classId) {
      throw new NotFoundException('Module assignment not found for this class');
    }
    return assignment;
  }
}
