import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs';
import { AuditRequest } from './audit.middleware';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AuditRequest>();
    return next.handle().pipe(tap(data => {
      // Only public authentication responses establish the actor. Admin-created
      // accounts must remain attributed to the admin performing the operation.
      if (/\/auth\/(login|register-parent)\/?$/.test(request.route?.path ?? '') && data?.user?.id) {
        request.auditActor = data.user;
      }
      if (request.method === 'POST' && typeof data?.id === 'string') request.auditResourceId = data.id;
    }));
  }
}
