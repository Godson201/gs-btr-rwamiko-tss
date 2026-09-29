import { Controller, Get, Header, Param, Query, Req, Res } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Request, Response } from 'express';
import { sendMedia } from '../../utils/send-media';
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
  async media(@Param('id') id: string, @Param('attachmentId') attachmentId: string, @Req() request: Request, @Res() response: Response) {
    const media = await this.announcements.findPublicMedia(id, attachmentId);
    sendMedia(request, response, media);
  }
}
