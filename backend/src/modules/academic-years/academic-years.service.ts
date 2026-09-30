import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AcademicScopeService } from '../rbac/academic-scope.service';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService, private readonly scope: AcademicScopeService) {}

  findAll() {
    return this.prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
  }

  async findAllForUser(userId: string) {
    return this.prisma.academicYear.findMany({
      where: await this.scope.academicYearWhere(userId, 'academic.view'),
      orderBy: { startDate: 'desc' },
    });
  }
}
