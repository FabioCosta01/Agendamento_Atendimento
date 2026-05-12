import type { Request } from 'express';

export function getClientIp(req: Request, trustProxy = false): string {
  if (!trustProxy) {
    return req.socket.remoteAddress ?? req.ip ?? 'unknown';
  }

  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp.trim();
  }

  return req.ip ?? 'unknown';
}
