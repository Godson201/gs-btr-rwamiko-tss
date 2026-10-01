import { ModuleType } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  learningHours?: number;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsEnum(ModuleType)
  moduleType?: ModuleType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competences?: string[];

  @IsOptional()
  @IsBoolean()
  isCore?: boolean;
}
