import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

const MODULE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  _count: { select: { classes: true } },
} satisfies Prisma.SubjectInclude;

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(departmentId?: string) {
    return this.prisma.subject.findMany({
      where: { departmentId },
      include: MODULE_INCLUDE,
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const foundModule = await this.prisma.subject.findUnique({
      where: { id },
      include: MODULE_INCLUDE,
    });
    if (!foundModule) {
      throw new NotFoundException('Module not found');
    }
    return foundModule;
  }

  create(dto: CreateModuleDto) {
    return this.prisma.subject.create({ data: dto, include: MODULE_INCLUDE });
  }

  async update(id: string, dto: UpdateModuleDto) {
    await this.findOne(id);
    return this.prisma.subject.update({ where: { id }, data: dto, include: MODULE_INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true };
  }
}
