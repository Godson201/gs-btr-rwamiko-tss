import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditMiddleware } from './audit.middleware';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditMiddleware, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(AuditMiddleware).forRoutes('{*path}'); }
}
