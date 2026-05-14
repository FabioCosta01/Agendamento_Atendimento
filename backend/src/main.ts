import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const bootstrapEnv = process.env.NODE_ENV ?? 'development';
  const app = await NestFactory.create(AppModule, {
    logger: bootstrapEnv === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const trustProxy = configService.get<string>('TRUST_PROXY', 'false') === 'true';
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const allowedOrigins = (frontendUrl ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOriginSet = new Set(allowedOrigins);
  const isAllowedDevelopmentOrigin = (origin: string) => {
    try {
      const url = new URL(origin);
      const isHttp = url.protocol === 'http:';
      const isFrontendDevPort = url.port === '5173';
      const isLocalOrPrivateNetwork =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.startsWith('10.') ||
        url.hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);

      return isHttp && isFrontendDevPort && isLocalOrPrivateNetwork;
    } catch {
      return false;
    }
  };

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      contentSecurityPolicy: nodeEnv === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      } : false,
      hsts: nodeEnv === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      } : false,
    }),
  );

  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (
        !origin ||
        allowedOriginSet.has(origin) ||
        (nodeEnv !== 'production' && isAllowedDevelopmentOrigin(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem nao permitida pelo CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

  if (trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  logger.log(`API pronta na porta ${port}`);
}

void bootstrap();
