import { AnnouncementType, Role } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  targetAudience: Role[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
