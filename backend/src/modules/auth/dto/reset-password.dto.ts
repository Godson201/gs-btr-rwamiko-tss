import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;

  // Optional for backward compatibility with existing API clients. The web
  // application always sends it and the service rejects a mismatch.
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
