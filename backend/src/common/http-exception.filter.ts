import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Erro interno do servidor';

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : Array.isArray((exceptionResponse as { message?: unknown }).message)
          ? (exceptionResponse as { message: string[] }).message.join(', ')
          : ((exceptionResponse as { message?: string }).message ?? 'Erro interno do servidor');

    const safePath = this.getSafePath(request.url);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${safePath}`,
        this.isProduction ? undefined : exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${safePath} -> ${status}: ${this.getSafeMessage(message)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: safePath,
      timestamp: new Date().toISOString(),
    });
  }

  private getSafePath(url: string): string {
    return url.split('?')[0] || '/';
  }

  private getSafeMessage(message: string): string {
    return message
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, 'Bearer [redacted]')
      .replace(/token=([^&\s]+)/gi, 'token=[redacted]')
      .replace(/password=([^&\s]+)/gi, 'password=[redacted]');
  }
}
