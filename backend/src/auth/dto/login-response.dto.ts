import type { UserRole } from 'shared';

export class LoginResponseDto {
  token!: string;
  tokenType!: string;
  requiresTwoFactor!: boolean;
  user!: {
    id: string;
    name: string;
    email: string;
    document: string;
    role: UserRole;
  };
}
