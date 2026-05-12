import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPasswordFlow';

/** Rotas permitidas com JWT enquanto `mustChangePassword` estiver ativo. */
export function AllowPendingPasswordFlow() {
  return SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);
}
