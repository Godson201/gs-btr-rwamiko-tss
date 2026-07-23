import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeachersService } from './teachers.service';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findAll(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.teachersService.findAll({
      search,
      departmentId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('me/assignments')
  @Roles(Role.TEACHER)
  findMyAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.findMyAssignments(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
