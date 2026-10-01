import { IsOptional, IsString } from 'class-validator';

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

}
