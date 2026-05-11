import type {
  AppointmentRecord,
  AvailabilityRecord,
  PropertyRecord,
  ServiceRecord,
  SessionUser,
  UserRecord,
} from '../lib/api';

export type AppData = {
  users: UserRecord[];
  services: ServiceRecord[];
  properties: PropertyRecord[];
  availability: AvailabilityRecord[];
  appointments: AppointmentRecord[];
};

export type PageCommonProps = {
  currentUser: SessionUser | null;
  data: AppData;
  loading: boolean;
  error: string;
  refreshData: () => Promise<void>;
};
