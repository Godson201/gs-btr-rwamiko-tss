import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from './audit.service';

export type AuditRequest = Request & { auditActor?: AuthenticatedUser; auditResourceId?: string };

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly audit: AuditService) {}
  use(request: AuditRequest, response: Response, next: NextFunction) {
    response.once('finish', () => {
      // Route templates omit query strings, passwords, reset tokens and arbitrary URLs.
      const route = typeof request.route?.path === 'string' ? request.route.path : '';
      if (!route || /\/health\/?$/.test(route) || ['HEAD', 'OPTIONS'].includes(request.method)) return;
      const actor = request.user as AuthenticatedUser | undefined ?? request.auditActor;
      if (request.method === 'GET' && !actor && response.statusCode < 400) return;
      const resource = route.replace(/^\/api\//, '').split('/')[0];
      const action = `${request.method} ${route}`;
      void this.audit.record({
        userId: actor?.id,
        actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
        actorEmail: actor?.email, actorRole: actor?.role,
        action, method: request.method, resource,
        resourceId: (typeof request.params.id === 'string' ? request.params.id : request.auditResourceId)?.slice(0, 200),
        statusCode: response.statusCode,
        ipAddress: request.ip?.slice(0, 100),
        userAgent: request.get('user-agent')?.slice(0, 500),
      });
    });
    next();
  }
}
