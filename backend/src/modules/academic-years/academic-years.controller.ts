import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AcademicYearsService } from './academic-years.service';

@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
@RequirePermissions('academic.view')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  findAll() {
    return this.academicYearsService.findAll();
  }
}
