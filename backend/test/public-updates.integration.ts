import 'reflect-metadata';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/database/prisma.service';
import { AnnouncementsModule } from '../src/modules/announcements/announcements.module';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';

const secret = 'public-updates-test-secret';
const users = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'].map(role => ({ id: role, role, portalAccess: [role],
  firstName: 'Test', lastName: role, email: `${role}@example.invalid`, isActive: true,
  accountStatus: 'ACTIVE', teacher: role === 'TEACHER' ? { staffTitle: 'HEAD_TEACHER' } : null }));
let saved: Record<string, any> = {};
let listQuery: Record<string, any> = {};
let mediaQuery: Record<string, any> = {};
const prisma = {
  user: { findUnique: async ({ where }: any) => users.find(user => user.id === where.id) },
  announcement: {
    create: async ({ data }: any) => { saved = { id: 'post', ...data }; return saved; },
    findUnique: async () => saved,
    update: async ({ data }: any) => { Object.assign(saved, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))); return saved; },
    findMany: async (query: any) => {
      listQuery = query;
      assert.equal(query.where.isPublic, true); assert.equal(query.where.isPublished, true);
      assert.ok(query.where.publishedAt.lte instanceof Date);
      assert.equal(query.where.OR[0].expiresAt, null); assert.ok(query.where.OR[1].expiresAt.gt instanceof Date);
      assert.deepEqual(Object.keys(query.select).sort(), ['attachments', 'content', 'id', 'publishedAt', 'title', 'type']);
      return [{ id: 'public-post', title: 'School news', content: 'Public content', type: 'GENERAL', publishedAt: new Date(),
        attachments: [{ id: 'photo', type: 'IMAGE', filename: 'photo.jpg' }] }];
    },
  },
  announcementAttachment: { findFirst: async (query: any) => { mediaQuery = query; return null; } },
};
@Global()
@Module({ providers: [ { provide: PrismaService, useValue: prisma },
  { provide: ConfigService, useValue: { getOrThrow: () => secret } }, JwtStrategy ], exports: [PrismaService] })
class Dependencies {}
@Module({ imports: [Dependencies, AnnouncementsModule] })
class TestApp {}

async function main() {
  const app = await NestFactory.create(TestApp, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`;
  const jwt = new JwtService({ secret });
  async function request(path: string, role?: string, method = 'GET', body?: object) {
    return fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
      ...(role ? { Authorization: `Bearer ${jwt.sign({ sub: role })}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  }
  const post = { title: 'News', content: 'News body', type: 'GENERAL', targetAudience: ['PARENT'], isPublished: true };
  try {
    const publicResponse = await request('/public/school-updates');
    assert.equal(publicResponse.status, 200);
    const publicData = await publicResponse.json() as any;
    assert.equal(publicData.items[0].attachments[0].url, '/api/public-media/public-post/photo');
    assert.equal(publicData.items[0].author, undefined); assert.equal(publicData.items[0].comments, undefined);
    assert.equal(publicData.items[0].reactions, undefined);
    assert.equal((await request('/announcements')).status, 401);
    for (const value of ['0', '-1', 'abc', '10001']) assert.equal((await request(`/public/school-updates?page=${value}`)).status, 400);
    assert.equal((await request('/public/school-updates?page=2')).status, 200);
    assert.equal(listQuery.skip, 6); assert.equal(listQuery.take, 7);
    assert.equal((await request('/announcements', 'TEACHER', 'POST', { ...post, isPublic: true })).status, 403);
    assert.equal((await request('/announcements', 'ADMIN', 'POST', post)).status, 201);
    assert.equal(saved.isPublic, false, 'Posts are private by default');
    assert.equal((await request('/announcements', 'SUPER_ADMIN', 'POST', { ...post, isPublic: true })).status, 201);
    assert.equal(saved.isPublic, true);
    saved.authorId = 'TEACHER';
    assert.equal((await request('/announcements/post', 'TEACHER', 'PATCH', { content: 'Changed' })).status, 403, 'Teachers cannot edit an admin-approved public post');
    assert.equal((await request('/announcements/post', 'ADMIN', 'PATCH', { isPublic: false })).status, 200);
    assert.equal(saved.isPublic, false);
    assert.equal((await request('/announcements/post', 'TEACHER', 'PATCH', { isPublic: true })).status, 403);
    assert.equal((await request('/public/school-updates/private/media/photo')).status, 404);
    assert.equal(mediaQuery.where.announcementId, 'private');
    assert.equal(mediaQuery.where.announcement.is.isPublic, true);
    assert.equal(mediaQuery.where.announcement.is.isPublished, true);
    assert.ok(mediaQuery.where.announcement.is.OR[1].expiresAt.gt instanceof Date);
    console.log('Public update checks passed: guest access, safe projection, visibility constraints, pagination, admin-only publishing and media authorization.');
  } finally { await app.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
