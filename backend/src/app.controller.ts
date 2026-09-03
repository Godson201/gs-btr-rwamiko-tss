import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getApiInfo() {
    return {
      name: 'G.S BTR RWAMIKO TSS API',
      status: 'running',
      version: '1.0',
      documentation: '/api/docs',
      health: '/api/health',
    };
  }

  @Get('health')
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', api: 'up', database: 'connected' };
    } catch {
      return { status: 'degraded', api: 'up', database: 'disconnected' };
    }
  }
}
