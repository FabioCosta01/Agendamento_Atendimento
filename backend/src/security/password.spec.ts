import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hashPassword, verifyPassword } from './password';

test('hashPassword e verifyPassword validam senha correta', () => {
  const hashed = hashPassword('123456');

  assert.equal(verifyPassword('123456', hashed), true);
  assert.equal(verifyPassword('senha-errada', hashed), false);
});
