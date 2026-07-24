import { IsNotEmpty, IsString } from 'class-validator';

export class LookupStudentDto {
  @IsString()
  @IsNotEmpty()
  admissionNo: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
