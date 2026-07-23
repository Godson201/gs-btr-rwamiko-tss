import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { ClassModulesService } from './class-modules.service';
import { AssignModuleDto } from './dto/assign-module.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('classes/:classId/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassModulesController {
  constructor(private readonly classModulesService: ClassModulesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findAll(@Param('classId') classId: string) {
    return this.classModulesService.findAll(classId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  assign(@Param('classId') classId: string, @Body() dto: AssignModuleDto) {
    return this.classModulesService.assign(classId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('classId') classId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.classModulesService.update(classId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('classId') classId: string, @Param('id') id: string) {
    return this.classModulesService.remove(classId, id);
  }
}
