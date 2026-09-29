import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Response } from 'express';
import { join } from 'path';
import { AnnouncementsService } from './announcements.service';

class PublicUpdatesQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page = 1;
}

@Controller('public/school-updates')
export class PublicAnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Query() query: PublicUpdatesQuery) { return this.announcements.findPublic(query.page); }

  @Get(':id/media/:attachmentId')
  async media(@Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: Response) {
    const filename = await this.announcements.findPublicMedia(id, attachmentId);
    response.setHeader('Cache-Control', 'no-store');
    response.sendFile(filename, { root: join(process.cwd(), 'uploads', 'announcements'), cacheControl: false });
  }
}
