import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { PermissionAccessService } from './permission-access.service';
import { RbacController } from './rbac.controller';
import { RoleAssignmentService } from './role-assignment.service';

@Global()
@Module({
  controllers: [RbacController],
  providers: [PermissionAccessService, PermissionsGuard, RoleAssignmentService],
  exports: [PermissionAccessService, PermissionsGuard, RoleAssignmentService],
})
export class RbacModule {}
