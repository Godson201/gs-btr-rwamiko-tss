import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RequiredPermissions,
} from '../decorators/permissions.decorator';
import { PermissionAccessService } from '../modules/rbac/permission-access.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionAccess: PermissionAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<RequiredPermissions>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement || requirement.permissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    if (!request.user?.id) throw new UnauthorizedException();

    const permitted =
      requirement.match === 'ANY'
        ? await this.permissionAccess.hasAnyPermission(request.user.id, requirement.permissions)
        : await this.permissionAccess.hasEveryPermission(request.user.id, requirement.permissions);

    if (!permitted) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
