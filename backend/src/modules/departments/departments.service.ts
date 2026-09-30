import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AcademicScopeService } from '../rbac/academic-scope.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService, private readonly scope: AcademicScopeService) {}

  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllForUser(userId: string) {
    return this.prisma.department.findMany({
      where: await this.scope.departmentWhere(userId, 'department.view'),
      orderBy: { name: 'asc' },
    });
  }
}
