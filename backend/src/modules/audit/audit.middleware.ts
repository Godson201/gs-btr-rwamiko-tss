import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from './audit.service';

type AuditDetailValue = string | number | boolean | null | string[];

export type AuditRequest = Request & {
  auditActor?: AuthenticatedUser;
  auditResourceId?: string;
  auditAction?: string;
  auditDetails?: Record<string, AuditDetailValue>;
};

// Audit metadata is allow-listed so a newly named credential cannot bypass a
// blacklist. Extend this list deliberately when another audited workflow is added.
const SAFE_DETAIL_KEYS = new Set(['roleCode', 'departmentIds', 'accountActive']);

export function setAuditContext(
  request: AuditRequest,
  context: {
    action: string;
    resourceId?: string;
    details?: Record<string, AuditDetailValue>;
  },
) {
  request.auditAction = context.action.slice(0, 200);
  request.auditResourceId = context.resourceId?.slice(0, 200);
  if (context.details) {
    request.auditDetails = Object.fromEntries(
      Object.entries(context.details)
        .filter(([key]) => SAFE_DETAIL_KEYS.has(key))
        .map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.slice(0, 10).map((item) => item.slice(0, 100))
            : typeof value === 'string'
              ? value.slice(0, 500)
              : value,
        ]),
    );
  }
}

function serializeDetails(details?: Record<string, AuditDetailValue>) {
  if (!details) return undefined;
  const serialized = JSON.stringify(details);
  return serialized.length > 2000 ? JSON.stringify({ truncated: true }) : serialized;
}

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
      const action = request.auditAction ?? `${request.method} ${route}`;
      void this.audit.record({
        userId: actor?.id,
        actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
        actorEmail: actor?.email, actorRole: actor?.role,
        action, method: request.method, resource,
        resourceId: (typeof request.params.id === 'string' ? request.params.id : request.auditResourceId)?.slice(0, 200),
        statusCode: response.statusCode,
        details: serializeDetails(request.auditDetails),
        ipAddress: request.ip?.slice(0, 100),
        userAgent: request.get('user-agent')?.slice(0, 500),
      });
    });
    next();
  }
}
