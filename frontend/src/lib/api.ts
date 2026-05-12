import axios from 'axios';

import { AppointmentStatus, UserRole } from 'shared';

const defaultDevApiUrl =
  typeof window === 'undefined' ? 'http://localhost:3001/api' : `http://${window.location.hostname}:3001/api`;
const defaultApiUrl = import.meta.env.PROD ? '/api' : defaultDevApiUrl;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultApiUrl,
});

// Log API base URL on initialization (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[API] Base URL:', api.defaults.baseURL);
  console.log('[API] Using VITE_API_URL:', !!import.meta.env.VITE_API_URL);
  console.log('[API] Environment:', { isProd: import.meta.env.PROD, isDev: import.meta.env.DEV });
}

// Add error interceptor for connection diagnostics
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        // Network error - connection refused, timeout, etc.
        console.error('[API] Connection Error Details:', {
          baseURL: api.defaults.baseURL,
          message: error.message,
          code: error.code,
        });
        if (error.message.includes('ECONNREFUSED')) {
          console.error('[API] Connection refused - Backend may not be running at:', api.defaults.baseURL);
        } else if (error.message.includes('ETIMEDOUT')) {
          console.error('[API] Connection timeout - Backend may be slow at:', api.defaults.baseURL);
        }
      }
    }
    return Promise.reject(error);
  },
);

const TOKEN_KEY = 'agendamento_atendimento_token';

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

export function hydrateAuthToken() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  return token;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export type SessionUser = {
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

export type LoginResponse = {
  user: SessionUser;
  token: string;
  tokenType: string;
  requiresTwoFactor: boolean;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  role: UserRole;
  attendanceMunicipalities?: Array<{
    municipality: {
      id: string;
      name: string;
      state: string;
    };
  }>;
  isActive: boolean;
  createdAt: string;
};

export type ServiceMunicipalityRecord = {
  id: string;
  name: string;
  state: string;
  active: boolean;
};

export type ServiceRecord = {
  id: string;
  name: string;
  classification: string;
  description?: string;
  durationMinutes: number;
  active: boolean;
};

export type PropertyRecord = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerDocument: string;
  ruralRegistry?: string;
  funruralCode?: string;
  displayName: string;
  city: string;
  state: string;
  address?: string;
  hasHabiteSe: boolean;
};

export type AvailabilityRecord = {
  id: string;
  extensionistId: string;
  municipalityId?: string | null;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  notes?: string;
  extensionist?: {
    id: string;
    name: string;
    email: string;
  };
  municipality?: {
    id: string;
    name: string;
    state: string;
  } | null;
  _count?: {
    appointments: number;
  };
};

export type AppointmentRecord = {
  id: string;
  requesterId: string;
  extensionistId?: string | null;
  serviceId: string;
  propertyId: string;
  availabilityId?: string | null;
  protocolCode: string;
  preferredDate: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  justification?: string | null;
  requester?: {
    id: string;
    name: string;
    email: string;
    document: string;
    phone?: string | null;
  };
  extensionist?: {
    id: string;
    name: string;
    email: string;
  } | null;
  service?: ServiceRecord;
  property?: PropertyRecord;
  availability?: AvailabilityRecord | null;
};

export type DashboardPayload = {
  users: UserRecord[];
  serviceMunicipalities: ServiceMunicipalityRecord[];
  services: ServiceRecord[];
  properties: PropertyRecord[];
  availability: AvailabilityRecord[];
  appointments: AppointmentRecord[];
  notifications: NotificationRecord[];
};

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

export type CreateAppointmentPayload = {
  requesterId: string;
  serviceId: string;
  propertyId: string;
  availabilityId?: string;
  preferredDate: string;
  notes?: string;
};

export async function login(document: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login', {
    document,
    password,
  });

  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get<SessionUser>('/auth/me');
  return response.data;
}

export async function fetchRequesters() {
  const response = await api.get<UserRecord[]>('/usuarios/solicitantes');
  return response.data;
}

export async function fetchProperties(ownerId?: string) {
  const url = ownerId ? `/propriedades?ownerId=${encodeURIComponent(ownerId)}` : '/propriedades';
  const response = await api.get<PropertyRecord[]>(url);
  return response.data;
}

export async function fetchDashboardData(role?: UserRole): Promise<DashboardPayload> {
  const shouldFetchUsers = role === UserRole.ADMINISTRADOR;
  const shouldFetchMunicipalities = role === UserRole.ADMINISTRADOR || role === UserRole.EXTENSIONISTA;
  const [users, serviceMunicipalities, services, properties, availability, appointments, notifications] = await Promise.allSettled([
    shouldFetchUsers ? api.get<UserRecord[]>('/usuarios') : Promise.resolve({ data: [] as UserRecord[] }),
    shouldFetchMunicipalities
      ? api.get<ServiceMunicipalityRecord[]>('/pontos-atendimento')
      : Promise.resolve({ data: [] as ServiceMunicipalityRecord[] }),
    api.get<ServiceRecord[]>('/servicos'),
    api.get<PropertyRecord[]>('/propriedades'),
    api.get<AvailabilityRecord[]>('/disponibilidade-agenda'),
    api.get<AppointmentRecord[]>('/agendamentos'),
    api.get<NotificationRecord[]>('/notificacoes'),
  ]);

  return {
    users: users.status === 'fulfilled' ? users.value.data : [],
    serviceMunicipalities: serviceMunicipalities.status === 'fulfilled' ? serviceMunicipalities.value.data : [],
    services: services.status === 'fulfilled' ? services.value.data : [],
    properties: properties.status === 'fulfilled' ? properties.value.data : [],
    availability: availability.status === 'fulfilled' ? availability.value.data : [],
    appointments: appointments.status === 'fulfilled' ? appointments.value.data : [],
    notifications: notifications.status === 'fulfilled' ? notifications.value.data : [],
  };
}

export async function markNotificationAsRead(id: string) {
  const response = await api.patch<NotificationRecord>(`/notificacoes/${id}/lida`);
  return response.data;
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const response = await api.post<AppointmentRecord>('/agendamentos', payload);
  return response.data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  document: string;
  password: string;
  phone?: string;
  role: UserRole;
  attendanceMunicipalityIds?: string[];
}) {
  const response = await api.post<UserRecord>('/usuarios', payload);
  return response.data;
}

export async function deleteProperty(id: string) {
  await api.delete(`/propriedades/${id}`);
}

export async function registerRequester(payload: {
  document: string;
  name: string;
  password: string;
  phone: string;
  community: string;
  city: string;
}) {
  const response = await api.post<UserRecord>('/usuarios/cadastrar-solicitante', payload);
  return response.data;
}

export async function updateUser(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    document: string;
    password: string;
    phone: string;
    role: UserRole;
    attendanceMunicipalityIds: string[];
    isActive: boolean;
  }>,
) {
  const response = await api.patch<UserRecord>(`/usuarios/${id}`, payload);
  return response.data;
}

export async function createService(payload: {
  name: string;
  classification: string;
  description?: string;
  durationMinutes: number;
  active: boolean;
}) {
  const response = await api.post<ServiceRecord>('/servicos', payload);
  return response.data;
}

export async function updateService(
  id: string,
  payload: Partial<{
    name: string;
    classification: string;
    description: string;
    durationMinutes: number;
    active: boolean;
  }>,
) {
  const response = await api.patch<ServiceRecord>(`/servicos/${id}`, payload);
  return response.data;
}

export async function createProperty(payload: {
  ownerId: string;
  ownerName: string;
  ownerDocument: string;
  ruralRegistry?: string;
  funruralCode?: string;
  displayName: string;
  city: string;
  state: string;
  address?: string;
  hasHabiteSe: boolean;
}) {
  const response = await api.post<PropertyRecord>('/propriedades', payload);
  return response.data;
}

export async function updateProperty(
  id: string,
  payload: Partial<{
    displayName: string;
    city: string;
    state: string;
    address?: string;
    ruralRegistry?: string;
    funruralCode?: string;
    hasHabiteSe: boolean;
  }>,
) {
  const response = await api.patch<PropertyRecord>(`/propriedades/${id}`, payload);
  return response.data;
}

export async function createAvailability(payload: {
  extensionistId: string;
  municipalityId: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  notes?: string;
}) {
  const response = await api.post<AvailabilityRecord>('/disponibilidade-agenda', payload);
  return response.data;
}

export async function createWeeklyAvailability(payload: {
  extensionistId: string;
  municipalityId: string;
  weekStartDate: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  timeBlocks?: Array<{
    date?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }>;
  capacity: number;
  notes?: string;
}) {
  const response = await api.post<AvailabilityRecord[]>('/disponibilidade-agenda/semanal', payload);
  return response.data;
}

export async function updateAvailability(
  id: string,
  payload: {
    startDateTime?: string;
    endDateTime?: string;
    municipalityId?: string;
    capacity?: number;
    notes?: string;
  },
) {
  const response = await api.patch<AvailabilityRecord>(`/disponibilidade-agenda/${id}`, payload);
  return response.data;
}

export async function deleteAvailability(id: string) {
  try {
    const response = await api.delete<{ id: string; deleted: boolean }>(`/disponibilidade-agenda/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { message?: unknown } | undefined)?.message;
      const canRetryWithPost =
        error.response?.status === 404 ||
        (typeof message === 'string' && message.includes('Cannot DELETE'));

      if (canRetryWithPost) {
        const response = await api.post<{ id: string; deleted: boolean }>(`/disponibilidade-agenda/${id}/excluir`);
        return response.data;
      }
    }

    throw error;
  }
}

export async function updateAppointmentStatus(
  protocolCode: string,
  payload: {
    status: AppointmentStatus;
    extensionistId?: string;
    justification?: string;
  },
) {
  const response = await api.patch<AppointmentRecord>(`/agendamentos/${protocolCode}/status`, payload);
  return response.data;
}

export async function rescheduleAppointment(
  protocolCode: string,
  payload: {
    availabilityId: string;
    justification: string;
  },
) {
  const response = await api.patch<AppointmentRecord>(`/agendamentos/${protocolCode}/reagendar`, payload);
  return response.data;
}
