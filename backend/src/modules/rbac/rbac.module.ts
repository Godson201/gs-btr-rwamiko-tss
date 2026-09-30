import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { PermissionAccessService } from './permission-access.service';
import { RbacController } from './rbac.controller';
import { RoleAssignmentService } from './role-assignment.service';
import { AcademicScopeService } from './academic-scope.service';

@Global()
@Module({
  controllers: [RbacController],
  providers: [PermissionAccessService, PermissionsGuard, RoleAssignmentService, AcademicScopeService],
  exports: [PermissionAccessService, PermissionsGuard, RoleAssignmentService, AcademicScopeService],
})
export class RbacModule {}
