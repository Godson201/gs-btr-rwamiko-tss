import { AnnouncementType } from '@prisma/client';
import { IsObject } from 'class-validator';

export class SetCategoryVisibilityDto {
  @IsObject()
  categories: Partial<Record<AnnouncementType, boolean>>;
}
