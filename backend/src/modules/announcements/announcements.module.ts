import { PublicAnnouncementsController } from './public-announcements.controller';
import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  controllers: [AnnouncementsController, PublicAnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
