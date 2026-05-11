import type { UserRole } from 'shared';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  document: string;
  role: UserRole;
  attendanceMunicipalities?: Array<{
    municipality: {
      id: string;
      name: string;
      state: string;
    };
  }>;
};
