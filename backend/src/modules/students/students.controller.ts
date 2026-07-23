import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import type { UploadedSpreadsheetFile } from '../../utils/uploaded-file.type';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findAll(
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.studentsService.findAll({
      search,
      classId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('bulk-import')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  bulkImport(@UploadedFile() file?: UploadedSpreadsheetFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.studentsService.bulkImport(file.buffer, file.originalname);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
