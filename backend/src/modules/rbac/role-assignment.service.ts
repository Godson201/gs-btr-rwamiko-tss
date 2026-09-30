import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { getSchoolRoleDefinition, SchoolRoleCode } from './school-role.catalog';

const LEGACY_TITLE_BY_ROLE = {
  HEAD_TEACHER: 'HEAD_TEACHER',
  DOS: 'DIRECTOR_OF_STUDIES',
  DOD: 'DIRECTOR_OF_DISCIPLINE',
  PATRON: 'PATRON',
  MATRON: 'MATRON',
} as const;

export const PRIMARY_STAFF_RESPONSIBILITY_CODES = [
  'TEACHER',
  'HEAD_TEACHER',
  'DOS',
  'DOD',
  'HOD',
  'PATRON',
  'MATRON',
] as const satisfies readonly SchoolRoleCode[];

@Injectable()
export class RoleAssignmentService {
  private readonly logger = new Logger(RoleAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  listAvailableRoles() {
    return this.prisma.schoolRole.findMany({
      where: { isActive: true },
      select: { code: true, label: true, description: true },
      orderBy: { label: 'asc' },
    });
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.userSchoolRole.findMany({
      where: { userId, isActive: true },
      select: {
        assignedAt: true,
        source: true,
        schoolRole: { select: { code: true, label: true, description: true } },
        departmentScopes: {
          select: { department: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { schoolRole: { label: 'asc' } },
    });
  }

  async assign(
    actorId: string,
    userId: string,
    roleCode: SchoolRoleCode,
    departmentIds: string[] = [],
  ) {
    if (actorId === userId) throw new ForbiddenException('You cannot assign roles to yourself');

    const definition = getSchoolRoleDefinition(roleCode);
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          teacher: { select: { id: true } },
          admin: { select: { id: true } },
        },
      }),
      this.prisma.schoolRole.findUnique({ where: { code: roleCode } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!role?.isActive) throw new BadRequestException('This school role is unavailable');
    if (definition.profileRequirement === 'TEACHER_PROFILE' && !user.teacher) {
      throw new BadRequestException('This role requires a teacher profile');
    }
    if (definition.profileRequirement === 'ADMIN_PROFILE' && !user.admin) {
      throw new BadRequestException('This role requires an administrator profile');
    }
    if (definition.profileRequirement === 'FUTURE_STAFF_PROFILE') {
      throw new BadRequestException('This role is not available for assignment yet');
    }
    if (roleCode === 'HOD' && departmentIds.length === 0) {
      throw new BadRequestException('Head of Department requires at least one department');
    }
    if (roleCode !== 'HOD' && departmentIds.length > 0) {
      throw new BadRequestException('Department scope is only supported for Head of Department');
    }
    if (departmentIds.length) {
      const count = await this.prisma.department.count({ where: { id: { in: departmentIds } } });
      if (count !== departmentIds.length) throw new BadRequestException('Unknown department scope');
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      if ((PRIMARY_STAFF_RESPONSIBILITY_CODES as readonly string[]).includes(roleCode)) {
        await tx.userSchoolRole.updateMany({
          where: {
            userId,
            isActive: true,
            schoolRoleId: { not: role.id },
            schoolRole: { code: { in: [...PRIMARY_STAFF_RESPONSIBILITY_CODES, 'CLASS_TEACHER'] } },
          },
          data: { isActive: false, assignedById: actorId },
        });
      }
      const assignment = await tx.userSchoolRole.upsert({
        where: { userId_schoolRoleId: { userId, schoolRoleId: role.id } },
        update: {
          isActive: true,
          assignedById: actorId,
          assignedAt: new Date(),
          source: 'MANUAL',
        },
        create: {
          userId,
          schoolRoleId: role.id,
          assignedById: actorId,
          source: 'MANUAL',
        },
      });
      await tx.userSchoolRoleDepartment.deleteMany({ where: { userSchoolRoleId: assignment.id } });
      if (departmentIds.length) {
        await tx.userSchoolRoleDepartment.createMany({
          data: departmentIds.map((departmentId) => ({
            userSchoolRoleId: assignment.id,
            departmentId,
          })),
        });
      }
      const legacyTitle = LEGACY_TITLE_BY_ROLE[roleCode as keyof typeof LEGACY_TITLE_BY_ROLE];
      if (user.teacher) {
        await tx.teacher.update({
          where: { id: user.teacher.id },
          data: { staffTitle: legacyTitle ?? null },
        });
      }
      return assignment;
    });

    let notificationSent = false;
    try {
      await this.mail.sendResponsibilityChangedEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        role.label,
      );
      notificationSent = true;
    } catch (error) {
      this.logger.error(
        `Responsibility changed for user ${userId}, but notification email failed: ${(error as Error).message}`,
      );
    }

    return { ...assignment, notificationSent };
  }

  async remove(actorId: string, userId: string, roleCode: SchoolRoleCode) {
    if (actorId === userId) throw new ForbiddenException('You cannot remove your own roles');
    if (roleCode === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
      if (teacher) throw new BadRequestException('Teacher role must remain while the teacher profile exists');
    }

    const role = await this.prisma.schoolRole.findUnique({ where: { code: roleCode }, select: { id: true } });
    if (!role) throw new NotFoundException('School role not found');
    const assignment = await this.prisma.userSchoolRole.findUnique({
      where: { userId_schoolRoleId: { userId, schoolRoleId: role.id } },
    });
    if (!assignment?.isActive) throw new NotFoundException('Active role assignment not found');

    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.userSchoolRole.update({
        where: { id: assignment.id },
        data: { isActive: false, assignedById: actorId },
      });
      const legacyTitle = LEGACY_TITLE_BY_ROLE[roleCode as keyof typeof LEGACY_TITLE_BY_ROLE];
      if (legacyTitle) {
        await tx.teacher.updateMany({
          where: { userId, staffTitle: legacyTitle },
          data: { staffTitle: null },
        });
      }
      return removed;
    });
  }
}
