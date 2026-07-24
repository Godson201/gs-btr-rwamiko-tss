import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, ParentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const APPROVAL_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      residenceLocation: true,
      workplaceLocation: true,
    },
  },
  requestedStudent: {
    select: {
      id: true,
      admissionNo: true,
      parentId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

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

  findApprovals(status: ParentStatus) {
    return this.prisma.parent.findMany({
      where: { status },
      include: APPROVAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(parentId: string, approvedById: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    let studentLinkWarning: string | null = null;

    return this.prisma.$transaction(async (tx) => {
      if (parent.requestedStudentId) {
        const student = await tx.student.findUnique({ where: { id: parent.requestedStudentId } });
        if (student && !student.parentId) {
          await tx.student.update({
            where: { id: student.id },
            data: { parentId: parent.id },
          });
        } else if (student?.parentId && student.parentId !== parent.id) {
          studentLinkWarning =
            'The requested student is already linked to a different parent — resolve this manually from the student edit page.';
        }
      }

      const updated = await tx.parent.update({
        where: { id: parentId },
        data: { status: ParentStatus.APPROVED, approvedAt: new Date(), approvedById },
        include: APPROVAL_INCLUDE,
      });

      await tx.user.update({
        where: { id: updated.userId },
        data: { accountStatus: AccountStatus.ACTIVE },
      });

      return { parent: updated, studentLinkWarning };
    });
  }

  async reject(parentId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.parent.update({
        where: { id: parentId },
        data: { status: ParentStatus.REJECTED },
        include: APPROVAL_INCLUDE,
      });

      await tx.user.update({
        where: { id: updated.userId },
        data: { accountStatus: AccountStatus.REJECTED },
      });

      return updated;
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
