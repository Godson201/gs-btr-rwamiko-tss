export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches backend JWT_EXPIRES_IN default

export interface SessionPayload {
  sub: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'SUPER_ADMIN';
  portalAccess: SessionPayload['role'][];
  accountStatus: 'ACTIVE' | 'PENDING' | 'REJECTED';
}

export function roleHomePath(role: SessionPayload['role']): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'STUDENT':
      return '/student/dashboard';
    case 'PARENT':
      return '/parent/dashboard';
    default:
      return '/';
  }
}
