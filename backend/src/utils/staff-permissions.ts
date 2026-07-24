import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../modules/auth/auth.types';

export function canManageSchoolWidePosts(user: AuthenticatedUser): boolean {
  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    return true;
  }
  return user.role === Role.TEACHER && user.staffTitle !== null;
}
