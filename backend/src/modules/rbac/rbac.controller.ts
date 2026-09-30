import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { AssignSchoolRoleDto } from './dto/assign-school-role.dto';
import { RoleAssignmentService } from './role-assignment.service';
import { SCHOOL_ROLE_CODES, SchoolRoleCode } from './school-role.catalog';
import { PermissionAccessService } from './permission-access.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class RbacController {
  constructor(
    private readonly assignments: RoleAssignmentService,
    private readonly access: PermissionAccessService,
  ) {}

  @Get('me/access')
  @Roles()
  myAccess(@CurrentUser() user: AuthenticatedUser) {
    return this.access.getAccessSummary(user.id);
  }

  @Get('roles')
  @RequirePermissions('users.view')
  listRoles() {
    return this.assignments.listAvailableRoles();
  }

  @Get('users/:userId/roles')
  @RequirePermissions('users.view')
  getUserRoles(@Param('userId') userId: string) {
    return this.assignments.getUserRoles(userId);
  }

  @Post('users/:userId/roles')
  @RequirePermissions('users.assign_role')
  assign(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: AssignSchoolRoleDto,
  ) {
    return this.assignments.assign(actor.id, userId, dto.roleCode, dto.departmentIds);
  }

  @Delete('users/:userId/roles/:roleCode')
  @RequirePermissions('users.remove_role')
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Param('roleCode') roleCode: string,
  ) {
    if (!SCHOOL_ROLE_CODES.includes(roleCode as SchoolRoleCode)) {
      throw new BadRequestException('Unknown school role');
    }
    return this.assignments.remove(actor.id, userId, roleCode as SchoolRoleCode);
  }
}
