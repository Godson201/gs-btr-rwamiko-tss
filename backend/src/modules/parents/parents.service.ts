import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.parent.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async findMyChildren(userId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { userId } });
    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    return this.prisma.student.findMany({
      where: { parentId: parent.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, level: true, section: true } },
      },
    });
  }
}
