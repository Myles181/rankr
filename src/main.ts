import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true,
  });

  app.use(session({
    secret:            process.env.SESSION_SECRET || 'rankr_dev_secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Serve HTML files from project root
  app.use(express.static(join(__dirname, '..')));
  app.use('/fan/dashboard',    (_req, res) => res.sendFile(join(__dirname, '..', '..', 'fan-dashboard.html')));
  app.use('/artist/dashboard', (_req, res) => res.sendFile(join(__dirname, '..', '..', 'artist-dashboard.html')));
  app.use('/artist/verify',    (_req, res) => res.sendFile(join(__dirname, '..', '..', 'index.html')));
  app.use('/auth-error',       (_req, res) => res.sendFile(join(__dirname, '..', '..', 'index.html')));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`\nRankr backend running on http://localhost:${port}`);
}
bootstrap();
