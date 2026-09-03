import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Param, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AdmissionStatus, Role } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'admissions');

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'resultDocument', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: (_req, _file, callback) => { if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true }); callback(null, UPLOAD_DIR); },
      filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${file.mimetype === 'application/pdf' ? '.pdf' : '.jpg'}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const valid = file.fieldname === 'resultDocument'
        ? file.mimetype === 'application/pdf'
        : file.fieldname === 'profilePicture' && ['image/jpeg', 'image/jpg'].includes(file.mimetype);
      callback(valid ? null : new BadRequestException(file.fieldname === 'profilePicture' ? 'The profile picture must be a JPG image' : 'The result slip or report card must be a PDF file'), valid);
    },
  }))
  create(@Body() dto: CreateAdmissionDto, @UploadedFiles() files?: { resultDocument?: { filename: string; originalname: string }[]; profilePicture?: { filename: string; originalname: string }[] }) {
    const resultDocument = files?.resultDocument?.[0];
    const profilePicture = files?.profilePicture?.[0];
    if (!resultDocument) throw new BadRequestException('A PDF report card or result slip is required');
    if (!profilePicture) throw new BadRequestException('A JPG student profile picture is required');
    return this.admissionsService.create(dto, resultDocument, profilePicture);
  }

  @Get('track')
  track(@Query('applicationNo') applicationNo?: string, @Query('email') email?: string) {
    if (!applicationNo || !email) throw new BadRequestException('Application number and guardian email are required');
    return this.admissionsService.track(applicationNo, email);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query('status') status?: AdmissionStatus) { return this.admissionsService.findAll(status); }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAdmissionStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return this.admissionsService.updateStatus(id, dto, user.id);
  }
}
