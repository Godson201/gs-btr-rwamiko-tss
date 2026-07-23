import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

const CLASS_INCLUDE = {
  academicYear: { select: { id: true, name: true } },
  _count: { select: { students: true } },
} satisfies Prisma.ClassInclude;

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.class.findMany({
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

  create(dto: CreateClassDto) {
    return this.prisma.class.create({ data: dto, include: CLASS_INCLUDE });
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
