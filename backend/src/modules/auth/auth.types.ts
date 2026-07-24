import { AccountStatus, Role, StaffTitle } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  portalAccess: Role[];
  accountStatus: AccountStatus;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  staffTitle: StaffTitle | null;
  portalAccess: Role[];
  accountStatus: AccountStatus;
}
