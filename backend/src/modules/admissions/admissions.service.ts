import { Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdmissionDto, resultDocument: { filename: string; originalname: string }, profilePicture: { filename: string; originalname: string }) {
    const applicationNo = `ADM-${new Date().getFullYear()}-${randomInt(100000, 999999)}`;
    const application = await this.prisma.admissionApplication.create({
      data: {
        ...dto,
        studentDateOfBirth: new Date(dto.studentDateOfBirth),
        guardianEmail: dto.guardianEmail.toLowerCase(),
        applicationNo,
        resultDocumentUrl: `/uploads/admissions/${resultDocument.filename}`,
        resultDocumentName: resultDocument.originalname,
        profilePictureUrl: `/uploads/admissions/${profilePicture.filename}`,
        profilePictureName: profilePicture.originalname,
      },
    });
    return { applicationNo: application.applicationNo, status: application.status, submittedAt: application.createdAt };
  }

  track(applicationNo: string, email: string) {
    return this.prisma.admissionApplication.findFirst({
      where: { applicationNo: applicationNo.toUpperCase(), guardianEmail: email.toLowerCase() },
      select: { applicationNo: true, studentFirstName: true, studentLastName: true, applyingLevel: true, preferredProgramme: true, status: true, reviewNotes: true, createdAt: true, updatedAt: true },
    });
  }

  findAll(status?: AdmissionStatus) {
    return this.prisma.admissionApplication.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, dto: UpdateAdmissionStatusDto, reviewedById: string) {
    const existing = await this.prisma.admissionApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Admission application not found');
    return this.prisma.admissionApplication.update({ where: { id }, data: { ...dto, reviewedById, reviewedAt: new Date() } });
  }
}
