import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly rateLimitStore = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    this.maxRequests = nodeEnv === 'production' ? 100 : 1000; // More restrictive in production
    this.windowMs = 15 * 60 * 1000; // 15 minutes
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const clientIP = this.getClientIP(req);
    const now = Date.now();

    // Rate limiting
    if (!this.checkRateLimit(clientIP, now)) {
      this.logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      res.status(429).json({
        statusCode: 429,
        message: 'Muitas requisicoes. Tente novamente mais tarde.',
        error: 'Too Many Requests',
      });
      return;
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Log suspicious requests
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn(`Suspicious request from ${clientIP}: ${req.method} ${req.path}`);
    }

    next();
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    const clientIP = req.headers['x-client-ip'] as string;

    // Priority: X-Real-IP > X-Forwarded-For > X-Client-IP > req.ip
    return realIP || (forwarded ? forwarded.split(',')[0].trim() : null) || clientIP || req.ip || 'unknown';
  }

  private checkRateLimit(clientIP: string, now: number): boolean {
    const entry = this.rateLimitStore.get(clientIP);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitStore.set(clientIP, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private isSuspiciousRequest(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousPatterns = [
      /\b(sqlmap|nikto|dirbuster|hydra|metasploit)\b/i,
      /\b(union.*select|script.*alert|javascript:)\b/i,
      /\.[/\\]/, // Path traversal
    ];

    return suspiciousPatterns.some(pattern =>
      pattern.test(req.url) ||
      pattern.test(userAgent) ||
      pattern.test(req.headers.referer || '')
    );
  }
}