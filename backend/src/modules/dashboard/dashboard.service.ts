import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [studentCount, teacherCount, parentCount, classCount] = await this.prisma.$transaction([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.parent.count(),
      this.prisma.class.count(),
    ]);

    return { studentCount, teacherCount, parentCount, classCount };
  }
}
