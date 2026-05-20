import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = parseInt(process.env.BACKEND_PORT ?? '4000', 10);
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀  API démarrée sur le port ${port}`, 'Bootstrap');
}
bootstrap();
