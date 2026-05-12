import assert from 'node:assert/strict';
import { test } from 'node:test';

import { JwtService } from './jwt.service';

test('JwtService assina e valida token', () => {
  const configService = {
    get(key: string, defaultValue?: string) {
      if (key === 'JWT_SECRET') {
        return 'segredo-super-seguro-com-mais-de-32-caracteres';
      }

      return defaultValue;
    },
  } as const;

  const jwtService = new JwtService(configService as never);
  const token = jwtService.signToken({
    id: '1',
    name: 'Teste',
    email: 'teste@example.com',
    document: '123',
    role: 'ADMINISTRADOR' as never,
    mustChangePassword: false,
  });

  const payload = jwtService.verifyToken(token);

  assert.equal(payload.id, '1');
  assert.equal(payload.email, 'teste@example.com');
});
