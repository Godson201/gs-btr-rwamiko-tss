import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsString()
  level: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsString()
  academicYearId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
