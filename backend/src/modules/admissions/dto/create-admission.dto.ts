import { AdmissionApplicantType, Gender } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class CreateAdmissionDto {
  @IsEnum(AdmissionApplicantType) applicantType: AdmissionApplicantType;
  @IsString() @IsNotEmpty() @MaxLength(80) studentFirstName: string;
  @IsString() @IsNotEmpty() @MaxLength(80) studentLastName: string;
  @IsDateString() studentDateOfBirth: string;
  @IsEnum(Gender) studentGender: Gender;
  @IsString() @IsNotEmpty() @MaxLength(160) previousSchool: string;
  @IsString() @IsNotEmpty() @MaxLength(200) previousSchoolLocation: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) transferReason: string;
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) averageMarks: number;
  @IsString() @IsNotEmpty() @MaxLength(40) applyingLevel: string;
  @IsString() @IsNotEmpty() @MaxLength(120) preferredProgramme: string;
  @IsString() @IsNotEmpty() @MaxLength(80) guardianFirstName: string;
  @IsString() @IsNotEmpty() @MaxLength(80) guardianLastName: string;
  @IsString() @IsNotEmpty() @MaxLength(50) guardianRelationship: string;
  @IsEmail() guardianEmail: string;
  @IsString() @IsNotEmpty() @MaxLength(30) guardianPhone: string;
  @IsString() @IsNotEmpty() @MaxLength(200) residence: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) notes: string;
}
