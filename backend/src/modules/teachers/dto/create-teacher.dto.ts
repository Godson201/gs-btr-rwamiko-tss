import { Gender } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
