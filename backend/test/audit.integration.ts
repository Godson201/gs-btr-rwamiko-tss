import 'reflect-metadata';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Body, Controller, Global, Module, Patch, Post, Get, UseGuards, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { AuditModule } from '../src/modules/audit/audit.module';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';
import { Roles } from '../src/decorators/roles.decorator';

// Exercise real HTTP routing, guards, DTO validation, middleware and interception.
// Only persistence is replaced; this suite never touches a school database.
const secret = 'isolated-audit-test-secret';
const users = [Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT].map(role => ({
  id: role, role, portalAccess: [role], firstName: 'Test', lastName: role,
  email: `${role}@example.invalid`, isActive: true, accountStatus: 'ACTIVE', teacher: null,
}));
const records: Record<string, unknown>[] = [];
let lastQuery: Record<string, any>;
let failWrites = false;
const prisma = {
  user: { findUnique: async ({ where }: { where: { id: string } }) => users.find(u => u.id === where.id) },
  auditLog: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      if (failWrites) throw new Error('Database unavailable');
      records.push(data); return data;
    },
    findMany: async (query: Record<string, any>) => { lastQuery = query; return []; },
    count: async () => records.length,
  },
  $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
};

@Global()
@Module({ providers: [
  { provide: PrismaService, useValue: prisma },
  { provide: ConfigService, useValue: { getOrThrow: () => secret } }, JwtStrategy,
], exports: [PrismaService] })
class TestDependencies {}

@Controller()
class TestActions {
  @Post('auth/login')
  login(@Body() body: { password: string }) {
    if (body.password !== 'test-password') throw new UnauthorizedException();
    return { user: users[0], accessToken: 'secret-response-token' };
  }
  @Post('auth/register') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  register() { return { user: users[2], accessToken: 'new-user-secret' }; }
  @Patch('teachers/:id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  update() { return { id: 'teacher-record', password: 'must-never-be-logged' }; }
  @Get('health')
  health() { return { ok: true }; }
}

@Module({ imports: [TestDependencies, AuditModule], controllers: [TestActions] })
class TestApp {}

async function main() {
  const app = await NestFactory.create(TestApp, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`;
  const jwt = new JwtService({ secret });
  async function request(path: string, role?: Role, method = 'GET', body?: object) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'Audit integration test' };
    if (role) headers.Authorization = `Bearer ${jwt.sign({ sub: role })}`;
    const response = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    await response.text();
    return response.status;
  }
  try {
    assert.equal(await request('/audit-logs'), 401);
    for (const role of [Role.TEACHER, Role.PARENT, Role.STUDENT]) {
      assert.equal(await request('/audit-logs', role), 403);
      assert.equal(records[records.length - 1]?.userId, role);
      assert.equal(records[records.length - 1]?.statusCode, 403);
    }
    for (const role of [Role.ADMIN, Role.SUPER_ADMIN]) assert.equal(await request('/audit-logs', role), 200);
    assert.equal(await request('/auth/login?token=query-secret', undefined, 'POST', { password: 'test-password' }), 201);
    assert.equal(records[records.length - 1]?.userId, Role.ADMIN);
    assert.equal(await request('/auth/login', undefined, 'POST', { password: 'wrong-secret' }), 401);
    assert.equal(records[records.length - 1]?.userId, undefined);
    assert.equal(records[records.length - 1]?.statusCode, 401);
    assert.equal(await request('/auth/register', Role.ADMIN, 'POST'), 201);
    assert.equal(records[records.length - 1]?.userId, Role.ADMIN, 'Account creation is attributed to the admin');
    assert.equal(await request('/teachers/teacher-record?password=secret-query', Role.ADMIN, 'PATCH', { password: 'secret-body' }), 200);
    assert.equal(records[records.length - 1]?.resourceId, 'teacher-record');
    assert.equal(records[records.length - 1]?.action, 'PATCH /api/teachers/:id');
    assert.equal(records[records.length - 1]?.actorEmail, 'ADMIN@example.invalid');
    const serialized = JSON.stringify(records);
    for (const value of ['test-password', 'wrong-secret', 'secret-body', 'secret-query', 'query-secret', 'secret-response-token', 'new-user-secret', 'must-never-be-logged', 'Bearer']) assert.ok(!serialized.includes(value));
    for (const query of ['page=0', 'limit=101', 'method=BOGUS', 'from=not-a-date', 'outcome=BOGUS', 'from=2026-09-30&to=2026-09-01']) assert.equal(await request(`/audit-logs?${query}`, Role.ADMIN), 400);
    assert.equal(await request('/audit-logs?page=2&limit=10&method=PATCH&outcome=failure&search=teacher&from=2026-09-01&to=2026-09-30', Role.ADMIN), 200);
    assert.equal(lastQuery!.skip, 10); assert.equal(lastQuery!.take, 10);
    assert.equal(lastQuery!.where.method, 'PATCH');
    assert.deepEqual(lastQuery!.where.statusCode, { gte: 400 });
    assert.equal(lastQuery!.where.createdAt.gte.toISOString(), '2026-09-01T00:00:00.000Z');
    assert.ok(lastQuery!.where.OR.length > 0);
    const count = records.length;
    assert.equal(await request('/health'), 200); assert.equal(records.length, count);
    failWrites = true;
    assert.equal(await request('/teachers/teacher-record', Role.ADMIN, 'PATCH'), 200, 'Audit storage failure must not misreport the completed change');
    console.log('Audit integration checks passed: access control, attribution, failures, redaction, filters, pagination and write failure.');
  } finally { await app.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
