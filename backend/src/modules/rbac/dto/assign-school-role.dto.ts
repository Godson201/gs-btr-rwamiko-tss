import { ArrayUnique, IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { SCHOOL_ROLE_CODES, SchoolRoleCode } from '../school-role.catalog';

export class AssignSchoolRoleDto {
  @IsIn(SCHOOL_ROLE_CODES)
  roleCode: SchoolRoleCode;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  departmentIds?: string[];
}
