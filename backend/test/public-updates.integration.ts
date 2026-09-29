import 'reflect-metadata';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AddressInfo } from 'node:net';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/database/prisma.service';
import { AnnouncementsModule } from '../src/modules/announcements/announcements.module';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';

const secret = 'public-updates-test-secret';
const users = ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'].map(role => ({ id: role, role, portalAccess: [role],
  firstName: 'Test', lastName: role, email: `${role}@example.invalid`, isActive: true,
  accountStatus: 'ACTIVE', teacher: role === 'TEACHER' ? { staffTitle: 'HEAD_TEACHER' } : null }));
let saved: Record<string, any> = {};
let listQuery: Record<string, any> = {};
let mediaQuery: Record<string, any> = {};
let mediaRecord: any = null;
const prisma = {
  systemSetting: { findMany: async () => [] },
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
  announcementAttachment: {
    createMany: async ({ data }: any) => { mediaRecord = { id: 'stored-media', ...data[0] }; return { count: data.length }; },
    findMany: async ({ select }: any) => { assert.equal(select.data, undefined); return [Object.fromEntries(Object.entries(mediaRecord).filter(([key]) => select[key]))]; },
    findFirst: async (query: any) => { mediaQuery = query;
      if (query.where.announcement && (!saved.isPublic || !saved.isPublished || (saved.expiresAt && saved.expiresAt <= new Date()))) return null;
      return mediaRecord ? { ...mediaRecord, announcement: saved } : null;
    },
  },
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
    // Upload through the real multipart controller, then serve from stored bytes
    // after the temporary file has been removed (as on a deployment restart).
    assert.equal((await request('/announcements', 'ADMIN', 'POST', { ...post, isPublic: true })).status, 201);
    const upload = new FormData();
    const bytes = Buffer.from('durable-media-fixture');
    upload.append('files', new Blob([bytes], { type: 'video/mp4' }), 'clip.mp4');
    const uploadResponse = await fetch(base + '/announcements/post/attachments', { method: 'POST',
      headers: { Authorization: `Bearer ${jwt.sign({ sub: 'ADMIN' })}` }, body: upload });
    assert.equal(uploadResponse.status, 201);
    const uploadJson = await uploadResponse.json() as any;
    assert.equal(uploadJson[0].data, undefined, 'Binary content must not leak into JSON feeds');
    assert.deepEqual(Buffer.from(mediaRecord.data), bytes);
    assert.equal(existsSync(join(process.cwd(), mediaRecord.url)), false, 'Uploaded temp file was removed');
    const mediaUrl = base + '/public/school-updates/post/media/stored-media';
    const fullMedia = await fetch(mediaUrl);
    assert.equal(fullMedia.status, 200); assert.equal(fullMedia.headers.get('content-type'), 'video/mp4');
    assert.deepEqual(Buffer.from(await fullMedia.arrayBuffer()), bytes);
    for (const [range, expected] of [['bytes=0-6', bytes.subarray(0, 7)], ['bytes=8-', bytes.subarray(8)], ['bytes=-7', bytes.subarray(-7)]] as const) {
      const partial = await fetch(mediaUrl, { headers: { Range: range } });
      assert.equal(partial.status, 206); assert.deepEqual(Buffer.from(await partial.arrayBuffer()), expected);
    }
    assert.equal((await fetch(mediaUrl, { headers: { Range: 'bytes=999-1000' } })).status, 416);
    const filename = mediaRecord.url.split('/').pop();
    assert.equal((await request(`/announcements/media/${filename}`)).status, 401);
    assert.equal((await request(`/announcements/media/${filename}`, 'ADMIN')).status, 200);
    assert.equal((await request(`/announcements/media/${filename}`, 'TEACHER')).status, 404);
    saved.targetAudience = ['TEACHER', 'PARENT', 'STUDENT'];
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT']) {
      assert.equal((await request(`/announcements/media/${filename}`, role)).status, 200, `${role} can open intended media`);
    }
    saved.isPublic = false;
    assert.equal((await fetch(mediaUrl)).status, 404, 'Unpublishing revokes the public media endpoint');
    saved.isPublic = true;
    saved.expiresAt = new Date('2000-01-01');
    assert.equal((await fetch(mediaUrl)).status, 404, 'Expired posts do not serve public media');
    console.log('Durable uploads passed: no filesystem dependency, private bytes, full media, seeking, invalid ranges and access control.');
    console.log('Public update checks passed: guest access, safe projection, visibility constraints, pagination, admin-only publishing and media authorization.');
  } finally { await app.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
