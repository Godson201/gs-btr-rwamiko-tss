import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';

class TeacherProfileFieldsDto {
  @IsOptional()
  @IsBoolean()
  worksAtAnotherSchool?: boolean;

  @IsOptional()
  @IsString()
  otherSchoolName?: string;
}

class ParentProfileFieldsDto {
  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  residenceLocationId?: string;

  @IsOptional()
  @IsString()
  workplaceLocationId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeacherProfileFieldsDto)
  teacher?: TeacherProfileFieldsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ParentProfileFieldsDto)
  parent?: ParentProfileFieldsDto;
}
