import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async provinces() {
    const rows = await this.prisma.location.findMany({
      distinct: ['province'],
      select: { province: true },
      orderBy: { province: 'asc' },
    });
    return rows.map((r) => r.province);
  }

  async districts(province: string) {
    const rows = await this.prisma.location.findMany({
      where: { province },
      distinct: ['district'],
      select: { district: true },
      orderBy: { district: 'asc' },
    });
    return rows.map((r) => r.district);
  }

  async sectors(province: string, district: string) {
    const rows = await this.prisma.location.findMany({
      where: { province, district },
      distinct: ['sector'],
      select: { sector: true },
      orderBy: { sector: 'asc' },
    });
    return rows.map((r) => r.sector);
  }

  async cells(province: string, district: string, sector: string) {
    const rows = await this.prisma.location.findMany({
      where: { province, district, sector },
      distinct: ['cell'],
      select: { cell: true },
      orderBy: { cell: 'asc' },
    });
    return rows.map((r) => r.cell);
  }

  async villages(province: string, district: string, sector: string, cell: string) {
    return this.prisma.location.findMany({
      where: { province, district, sector, cell },
      select: { id: true, village: true },
      orderBy: { village: 'asc' },
    });
  }
}
