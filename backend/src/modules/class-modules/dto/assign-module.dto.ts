import { IsOptional, IsString } from 'class-validator';

export class AssignModuleDto {
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}
