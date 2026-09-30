import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './audit-query.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermissions('system.audit.view')
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get()
  list(@Query() query: AuditQueryDto) { return this.audit.list(query); }
}
