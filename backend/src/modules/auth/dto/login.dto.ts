import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Accepts either an email address or a phone number — validated as a plain non-empty string
  // since AuthService.validateUser() looks it up against both User.email and User.phone.
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
