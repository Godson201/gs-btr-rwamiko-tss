import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditQueryDto } from './audit-query.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  async record(data: Prisma.AuditLogUncheckedCreateInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data });
    } catch {
      // Do not turn a completed operation into an apparent failure, or print its data.
      this.logger.error('Unable to persist an activity log entry. Check database availability.');
    }
  }

  async list(query: AuditQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from > to) throw new BadRequestException('Start date must be before end date');
    const search = query.search?.trim();
    const where: Prisma.AuditLogWhereInput = {
      method: query.method,
      statusCode: query.outcome === 'failure' ? { gte: 400 } : query.outcome === 'success' ? { lt: 400 } : undefined,
      createdAt: from || to ? { gte: from, lte: to } : undefined,
      OR: search ? [
        ...['actorName', 'actorEmail', 'action', 'resource', 'resourceId'].map(field => ({ [field]: { contains: search, mode: 'insensitive' } })),
        { user: { is: { OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ] } } },
      ] : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit, take: query.limit,
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items, total, page: query.page, limit: query.limit };
  }
}
