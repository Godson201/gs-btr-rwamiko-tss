import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { PermissionAccessService } from './permission-access.service';

@Global()
@Module({
  providers: [PermissionAccessService, PermissionsGuard],
  exports: [PermissionAccessService, PermissionsGuard],
})
export class RbacModule {}
