import { Gender } from '@prisma/client';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
