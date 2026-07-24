import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  // helmet defaults Cross-Origin-Resource-Policy to "same-origin", which makes browsers block
  // <img>/<video>/<audio> loaded from the frontend's origin (a different port = different origin)
  // with net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin. Uploaded media is meant to be embedded
  // cross-origin by this app's architecture, so relax it just for this route (the rest of the
  // API keeps helmet's default same-origin policy).
  // Static assets are served before enableCors() registers its middleware, so they never reach
  // it — set the CORS header here too, otherwise fetch()-based downloads (which need real CORS,
  // unlike plain <img>/<video> tags) are blocked cross-origin.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'));
    },
  });
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('G.S BTR RWAMIKO TSS API')
    .setDescription('School Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${port}/api (docs at /api/docs)`);
}

bootstrap();
