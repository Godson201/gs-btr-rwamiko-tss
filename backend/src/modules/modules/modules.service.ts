import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { parseSpreadsheet } from '../../utils/parse-spreadsheet';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AcademicScopeService } from '../rbac/academic-scope.service';

const MODULE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  classes: {
    select: {
      class: {
        select: { id: true, name: true, level: true, academicYear: { select: { name: true } } },
      },
    },
  },
  _count: { select: { classes: true } },
} satisfies Prisma.SubjectInclude;

export interface ModuleBulkImportResult {
  created: { row: number; code: string }[];
  failed: { row: number; error: string }[];
}

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService, private readonly scope: AcademicScopeService) {}

  async findAllForUser(userId: string, departmentId?: string) {
    const scope = await this.scope.subjectWhere(userId, 'academic.curriculum.view');
    return this.prisma.subject.findMany({
      where: { AND: [scope, { departmentId }] },
      include: MODULE_INCLUDE,
      orderBy: { code: 'asc' },
    });
  }

  async findOneForUser(userId: string, id: string) {
    const scope = await this.scope.subjectWhere(userId, 'academic.curriculum.view');
    const foundModule = await this.prisma.subject.findFirst({
      where: { AND: [{ id }, scope] },
      include: MODULE_INCLUDE,
    });
    if (!foundModule) throw new NotFoundException('Module not found');
    return foundModule;
  }

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

  async create(dto: CreateModuleDto) {
    const { classId, departmentId, ...moduleData } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        let resolvedDepartmentId = departmentId;
        if (classId) {
          const selectedClass = await tx.class.findUnique({
            where: { id: classId },
            select: { id: true, departmentId: true },
          });
          if (!selectedClass) throw new BadRequestException('Selected class does not exist');
          if (!selectedClass.departmentId) {
            throw new BadRequestException('Selected class is not assigned to a trade');
          }
          resolvedDepartmentId = selectedClass.departmentId;
        }

        const created = await tx.subject.create({
          data: { ...moduleData, departmentId: resolvedDepartmentId },
        });
        if (classId) {
          await tx.classSubject.create({ data: { classId, subjectId: created.id } });
        }
        return tx.subject.findUniqueOrThrow({ where: { id: created.id }, include: MODULE_INCLUDE });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A module with this code already exists');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('The selected class or trade is invalid');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateModuleDto) {
    await this.findOne(id);
    const { classId, departmentId, ...moduleData } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        let resolvedDepartmentId = departmentId;
        if (classId) {
          const selectedClass = await tx.class.findUnique({
            where: { id: classId },
            select: { departmentId: true },
          });
          if (!selectedClass) throw new BadRequestException('Selected class does not exist');
          if (!selectedClass.departmentId) {
            throw new BadRequestException('Selected class is not assigned to a trade');
          }
          resolvedDepartmentId = selectedClass.departmentId;
        }

        await tx.subject.update({
          where: { id },
          data: { ...moduleData, departmentId: resolvedDepartmentId },
        });

        if (classId) {
          const assignments = await tx.classSubject.findMany({
            where: { subjectId: id },
            orderBy: { createdAt: 'asc' },
          });
          if (!assignments.some((assignment) => assignment.classId === classId)) {
            if (assignments[0]) {
              await tx.classSubject.update({
                where: { id: assignments[0].id },
                data: { classId },
              });
            } else {
              await tx.classSubject.create({ data: { classId, subjectId: id } });
            }
          }
        }

        return tx.subject.findUniqueOrThrow({ where: { id }, include: MODULE_INCLUDE });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('The module code or class assignment already exists');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('The selected class or trade is invalid');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true };
  }

  async bulkImport(buffer: Buffer, filename: string): Promise<ModuleBulkImportResult> {
    const rows = await parseSpreadsheet(buffer, filename);
    const result: ModuleBulkImportResult = { created: [], failed: [] };

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      try {
        const code = row.code?.trim();
        const name = row.name?.trim();

        if (!code || !name) {
          throw new Error('code and name are required');
        }

        const existing = await this.prisma.subject.findUnique({ where: { code } });
        if (existing) {
          throw new Error(`A module with code "${code}" already exists`);
        }

        let departmentId: string | undefined;
        const departmentCode = row.departmentCode?.trim();
        if (departmentCode) {
          const department = await this.prisma.department.findUnique({
            where: { code: departmentCode },
          });
          if (!department) {
            throw new Error(`Unknown department code "${departmentCode}"`);
          }
          departmentId = department.id;
        }

        await this.prisma.subject.create({
          data: {
            code,
            name,
            departmentId,
            credits: row.credits ? Number(row.credits) : undefined,
            learningHours: row.learningHours ? Number(row.learningHours) : undefined,
            competences: row.competences
              ? row.competences.split(';').map((item) => item.trim()).filter(Boolean)
              : [],
            isCore: row.isCore?.trim().toLowerCase() === 'true',
          },
        });

        result.created.push({ row: rowNumber, code });
      } catch (error) {
        result.failed.push({ row: rowNumber, error: (error as Error).message });
      }
    }

    return result;
  }
}
