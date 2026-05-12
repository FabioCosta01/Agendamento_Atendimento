import { randomBytes } from 'node:crypto';

const CHARSET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Senha provisória forte (sem caracteres ambíguos 0/O, 1/l). */
export function generateProvisionalPassword(length = 14): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i]! % CHARSET.length]!;
  }
  return out;
}
