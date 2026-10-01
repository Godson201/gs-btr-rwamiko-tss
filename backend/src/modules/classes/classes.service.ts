import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AcademicScopeService } from '../rbac/academic-scope.service';

const CLASS_INCLUDE = {
  academicYear: { select: { id: true, name: true } },
  department: { select: { id: true, name: true, code: true } },
  _count: { select: { students: true } },
} satisfies Prisma.ClassInclude;

const CLASS_CHOICES: Record<string, Array<{ name: string; level: string }>> = {
  CSA: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} CSA`, level })),
  SOD: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} SWD`, level })),
  NIT: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} NIT`, level })),
  ELT: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} ELT`, level })),
  ETT: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} ETE`, level })),
  BCN: ['L3', 'L4', 'L5'].map((level) => ({ name: `${level} BDC`, level })),
  ACC: ['S4', 'S5', 'S6'].map((level) => ({ name: `${level} ACC`, level })),
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService, private readonly scope: AcademicScopeService) {}

  findAll() {
    return this.prisma.class.findMany({
      include: CLASS_INCLUDE,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.class.findMany({
      where: await this.scope.classWhere(userId, 'academic.view'),
      include: CLASS_INCLUDE,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const klass = await this.prisma.class.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (!klass) {
      throw new NotFoundException('Class not found');
    }
    return klass;
  }

  async findOneForUser(userId: string, id: string) {
    const scope = await this.scope.classWhere(userId, 'academic.view');
    const klass = await this.prisma.class.findFirst({
      where: { AND: [{ id }, scope] },
      include: CLASS_INCLUDE,
    });
    if (!klass) throw new NotFoundException('Class not found');
    return klass;
  }

  async create(dto: CreateClassDto) {
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { code: true },
      });
      if (!department) throw new BadRequestException('Selected trade does not exist');

      const choices = CLASS_CHOICES[department.code];
      if (!choices?.some((choice) => choice.name === dto.name && choice.level === dto.level)) {
        throw new BadRequestException('Select a valid class for the chosen trade');
      }
    }

    try {
      return await this.prisma.class.create({ data: dto, include: CLASS_INCLUDE });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This class already exists for the selected academic year');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('The selected trade or academic year is invalid');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    return this.prisma.class.update({ where: { id }, data: dto, include: CLASS_INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.class.delete({ where: { id } });
    return { success: true };
  }
}
