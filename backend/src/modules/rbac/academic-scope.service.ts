import { Injectable } from '@nestjs/common';
import { PermissionScopeMode, Prisma } from '@prisma/client';
import { PermissionAccessService } from './permission-access.service';
import { PermissionCode } from './permission.catalog';

@Injectable()
export class AcademicScopeService {
  constructor(private readonly access: PermissionAccessService) {}

  private async grants(userId: string, permission: PermissionCode) {
    return (await this.access.resolve(userId)).get(permission) ?? [];
  }

  async classWhere(userId: string, permission: PermissionCode): Promise<Prisma.ClassWhereInput> {
    const grants = await this.grants(userId, permission);
    if (grants.some((grant) => grant.scope === PermissionScopeMode.SCHOOL)) return {};

    const departmentIds = grants
      .filter((grant) => grant.scope === PermissionScopeMode.DEPARTMENT)
      .flatMap((grant) => grant.departmentIds);
    const or: Prisma.ClassWhereInput[] = [];
    if (departmentIds.length) {
      or.push({ subjects: { some: { subject: { departmentId: { in: departmentIds } } } } });
    }
    if (grants.some((grant) => grant.scope === PermissionScopeMode.TEACHING_ASSIGNMENT)) {
      or.push(
        { subjects: { some: { teacher: { userId } } } },
        { teachers: { some: { teacher: { userId } } } },
      );
    }
    if (grants.some((grant) => grant.scope === PermissionScopeMode.CLASS_MASTER)) {
      or.push({ teachers: { some: { teacher: { userId }, isClassMaster: true } } });
    }
    return or.length ? { OR: or } : { id: '__rbac_no_access__' };
  }

  async academicYearWhere(
    userId: string,
    permission: PermissionCode,
  ): Promise<Prisma.AcademicYearWhereInput> {
    const grants = await this.grants(userId, permission);
    if (grants.some((grant) => grant.scope === PermissionScopeMode.SCHOOL)) return {};
    return { classes: { some: await this.classWhere(userId, permission) } };
  }

  async subjectWhere(userId: string, permission: PermissionCode): Promise<Prisma.SubjectWhereInput> {
    const grants = await this.grants(userId, permission);
    if (grants.some((grant) => grant.scope === PermissionScopeMode.SCHOOL)) return {};

    const departmentIds = grants
      .filter((grant) => grant.scope === PermissionScopeMode.DEPARTMENT)
      .flatMap((grant) => grant.departmentIds);
    const or: Prisma.SubjectWhereInput[] = [];
    if (departmentIds.length) or.push({ departmentId: { in: departmentIds } });
    if (grants.some((grant) => grant.scope === PermissionScopeMode.TEACHING_ASSIGNMENT)) {
      or.push(
        { teachers: { some: { teacher: { userId } } } },
        { classes: { some: { teacher: { userId } } } },
      );
    }
    return or.length ? { OR: or } : { id: '__rbac_no_access__' };
  }

  async classSubjectWhere(
    userId: string,
    classId: string,
    permission: PermissionCode,
  ): Promise<Prisma.ClassSubjectWhereInput> {
    const grants = await this.grants(userId, permission);
    if (grants.some((grant) => grant.scope === PermissionScopeMode.SCHOOL)) return { classId };

    const departmentIds = grants
      .filter((grant) => grant.scope === PermissionScopeMode.DEPARTMENT)
      .flatMap((grant) => grant.departmentIds);
    const or: Prisma.ClassSubjectWhereInput[] = [];
    if (departmentIds.length) or.push({ subject: { departmentId: { in: departmentIds } } });
    if (grants.some((grant) => grant.scope === PermissionScopeMode.TEACHING_ASSIGNMENT)) {
      or.push(
        { teacher: { userId } },
        { subject: { teachers: { some: { teacher: { userId } } } } },
      );
    }
    return or.length ? { classId, OR: or } : { id: '__rbac_no_access__' };
  }

  async departmentWhere(
    userId: string,
    permission: PermissionCode,
  ): Promise<Prisma.DepartmentWhereInput> {
    const grants = await this.grants(userId, permission);
    if (grants.some((grant) => grant.scope === PermissionScopeMode.SCHOOL)) return {};

    const ids = grants
      .filter((grant) => grant.scope === PermissionScopeMode.DEPARTMENT)
      .flatMap((grant) => grant.departmentIds);
    const or: Prisma.DepartmentWhereInput[] = ids.length ? [{ id: { in: ids } }] : [];
    if (grants.some((grant) => grant.scope === PermissionScopeMode.TEACHING_ASSIGNMENT)) {
      or.push(
        { teachers: { some: { userId } } },
        { subjects: { some: { teachers: { some: { teacher: { userId } } } } } },
        { subjects: { some: { classes: { some: { teacher: { userId } } } } } },
      );
    }
    return or.length ? { OR: or } : { id: '__rbac_no_access__' };
  }
}
