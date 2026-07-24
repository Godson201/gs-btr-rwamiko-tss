import { Gender, StaffTitle } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  gender?: Gender;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(StaffTitle)
  staffTitle?: StaffTitle | null;
}
