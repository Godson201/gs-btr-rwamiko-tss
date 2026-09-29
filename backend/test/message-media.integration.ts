import 'reflect-metadata';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/database/prisma.service';
import { MessagesModule } from '../src/modules/messages/messages.module';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';

const secret = 'message-media-test-secret';
const users = ['PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'STUDENT'].map(role => ({
  id: role, role, portalAccess: [role], firstName: 'Test', lastName: role,
  email: `${role}@example.invalid`, isActive: true, accountStatus: 'ACTIVE', teacher: null,
}));
let owner = 'PARENT';
let media: any;
const prisma = {
  user: { findUnique: async ({ where }: any) => users.find(user => user.id === where.id) },
  conversation: {
    findUnique: async () => ({ id: 'conversation', userId: owner }),
    update: async () => ({ id: 'conversation' }),
  },
  message: {
    create: async ({ data, include }: any) => {
      assert.equal(include.attachments.select.data, undefined);
      media = { id: 'attachment', ...data.attachments.create[0], message: { conversation: { userId: owner } } };
      return { id: 'message', content: data.content, attachments: [Object.fromEntries(
        Object.entries(media).filter(([key]) => include.attachments.select[key]))] };
    },
  },
  messageAttachment: { findFirst: async ({ where }: any) => media?.url === where.url ? media : null },
};
@Global()
@Module({ providers: [{ provide: PrismaService, useValue: prisma },
  { provide: ConfigService, useValue: { getOrThrow: () => secret } }, JwtStrategy], exports: [PrismaService] })
class Dependencies {}
@Module({ imports: [Dependencies, MessagesModule] })
class TestApp {}

async function main() {
  const app = await NestFactory.create(TestApp, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/messages`;
  const jwt = new JwtService({ secret });
  const auth = (role: string) => ({ Authorization: `Bearer ${jwt.sign({ sub: role })}` });
  const bytes = Buffer.from('persistent-message-audio-fixture');
  try {
    for (const sender of ['PARENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']) {
      owner = sender === 'TEACHER' ? 'TEACHER' : 'PARENT';
      const upload = new FormData();
      upload.append('files', new Blob([bytes], { type: 'audio/mp4' }), 'voice-note.m4a');
      const endpoint = sender.includes('ADMIN') ? '/conversations/conversation' : '/my-conversation';
      const response = await fetch(base + endpoint, { method: 'POST', headers: auth(sender), body: upload });
      assert.equal(response.status, 201);
      const result = await response.json() as any;
      assert.equal(result.attachments[0].data, undefined);
      assert.deepEqual(Buffer.from(media.data), bytes);
      assert.equal(existsSync(join(process.cwd(), media.url)), false, 'Temporary file removed');
      const url = base + '/media/' + media.url.split('/').pop();
      assert.equal((await fetch(url)).status, 401);
      assert.equal((await fetch(url, { headers: auth(owner === 'PARENT' ? 'TEACHER' : 'PARENT') })).status, 404);
      assert.equal((await fetch(url, { headers: auth('STUDENT') })).status, 403);
      for (const viewer of [owner, 'ADMIN', 'SUPER_ADMIN']) {
        const full = await fetch(url, { headers: auth(viewer) });
        assert.equal(full.status, 200);
        assert.equal(full.headers.get('content-type'), 'audio/mp4');
        assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
        const range = await fetch(url, { headers: { ...auth(viewer), Range: 'bytes=2-9' } });
        assert.equal(range.status, 206);
        assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(2, 10));
      }
      media.data = null;
      assert.equal((await fetch(url, { headers: auth(owner) })).status, 404, 'Missing legacy files return a clear 404');
    }
    console.log('Message media passed: persistent multipart uploads, binary-free JSON, audio MIME, seeking, conversation access and missing files.');
  } finally { await app.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
