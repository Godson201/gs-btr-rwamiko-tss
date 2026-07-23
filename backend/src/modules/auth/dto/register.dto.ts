import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Gender, Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  @IsIn([Role.STUDENT, Role.TEACHER, Role.PARENT, Role.ADMIN])
  role: Role;

  // Role-specific fields (validated conditionally in the service)
  @ValidateIf((o) => o.role === Role.STUDENT || o.role === Role.TEACHER)
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ValidateIf((o) => o.role === Role.STUDENT || o.role === Role.TEACHER)
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsString()
  @IsOptional()
  classId?: string;

  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsString()
  @IsOptional()
  academicYear?: string;
}
