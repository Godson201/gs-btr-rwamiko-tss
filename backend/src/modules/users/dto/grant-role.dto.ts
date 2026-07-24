import { Role } from '@prisma/client';
import { IsIn } from 'class-validator';

export class GrantRoleDto {
  @IsIn([Role.TEACHER, Role.PARENT])
  role: typeof Role.TEACHER | typeof Role.PARENT;
}
