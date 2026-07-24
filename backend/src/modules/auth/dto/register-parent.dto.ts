import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterParentDto {
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

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  residenceLocationId?: string;

  @IsOptional()
  @IsString()
  workplaceLocationId?: string;

  // "Find your child" step: either a confirmed match from GET /auth/lookup-student, or a
  // free-text claim the admin will verify by hand if no confident match was found.
  @IsOptional()
  @IsString()
  requestedStudentId?: string;

  @IsOptional()
  @IsString()
  claimedStudentName?: string;

  @IsOptional()
  @IsString()
  claimedAdmissionNo?: string;
}
