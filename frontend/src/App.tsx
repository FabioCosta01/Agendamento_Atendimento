import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppointmentStatus, UserRole } from 'shared';

import {
  createAppointment,
  createWeeklyAvailability,
  createProperty,
  createService,
  createUser,
  deleteAvailability,
  deleteProperty,
  fetchCurrentUser,
  fetchDashboardData,
  fetchProperties,
  fetchRequesters,
  getApiErrorMessage,
  hydrateAuthToken,
  login,
  markNotificationAsRead,
  registerRequester,
  rescheduleAppointment,
  setAuthToken,
  updateAppointmentStatus,
  updateProperty,
  updateService,
  updateUser,
  type AppointmentRecord,
  type DashboardPayload,
  type PropertyRecord,
  type SessionUser,
  type UserRecord,
} from './lib/api';
import { LocalMessagesContainer, useLocalMessages } from './components/LocalMessages';

const emptyData: DashboardPayload = {
  users: [],
  serviceMunicipalities: [],
  services: [],
  properties: [],
  availability: [],
  appointments: [],
  notifications: [],
};

const initialAppointmentForm = {
  serviceId: '',
  propertyId: '',
  availabilityId: '',
  preferredDate: '',
  notes: '',
};

const initialPropertyForm = {
  displayName: '',
  city: '',
  state: 'MT',
  address: '',
  ruralRegistry: '',
  funruralCode: '',
  hasHabiteSe: false,
};

const initialWeeklyForm = {
  weekStartDate: getNextWeekStartDate(),
  weekdays: [1],
  dayCapacity: {
    1: { morning: 2, afternoon: 2 },
    2: { morning: 2, afternoon: 2 },
    3: { morning: 2, afternoon: 2 },
    4: { morning: 2, afternoon: 2 },
    5: { morning: 2, afternoon: 2 },
  } as Record<number, { morning: number; afternoon: number }>,
  dayTimes: {
    1: { morning: ['07:00', '09:00'], afternoon: ['13:00', '15:00'] },
    2: { morning: ['07:00', '09:00'], afternoon: ['13:00', '15:00'] },
    3: { morning: ['07:00', '09:00'], afternoon: ['13:00', '15:00'] },
    4: { morning: ['07:00', '09:00'], afternoon: ['13:00', '15:00'] },
    5: { morning: ['07:00', '09:00'], afternoon: ['13:00', '15:00'] },
  } as Record<number, { morning: string[]; afternoon: string[] }>,
  notes: '',
};

const initialRescheduleForm = {
  protocolCode: '',
  date: '',
  period: 'morning',
  availabilityId: '',
  justification: '',
};

const initialCancelForm = {
  protocolCode: '',
  justification: '',
};

const initialUserForm = {
  name: '',
  email: '',
  document: '',
  password: '',
  phone: '',
  role: UserRole.SOLICITANTE,
};

const initialServiceForm = {
  name: '',
  classification: 'Outros atendimentos',
  description: '',
  durationMinutes: 60,
  active: true,
};

const serviceClassificationOrder = [
  'Agroindustria',
  'Assistencia tecnica produtiva ANIMAL',
  'Assistencia tecnica produtiva VEGETAL',
  'Associacoes, cooperativas e comunidade',
  'CAF - Cadastro da Agricultura Familiar',
  'Comercializacao e mercados institucionais - PNAE PAA e outros',
  'Credito e financiamento rural',
  'Fomento produtivo e inclusao rural',
  'Meio ambiente e sustentabilidade rural',
  'Outros atendimentos',
  'Turismo rural',
];

const defaultServiceClassification = 'Outros atendimentos';

const initialRequesterRegistrationForm = {
  document: '',
  name: '',
  password: '',
  phone: '',
  community: '',
  city: '',
};

type SectionKey = 'novo' | 'protocolos' | 'notificacoes' | 'propriedades' | 'atendimentos' | 'agenda' | 'usuarios' | 'servicos';

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'default';
  onConfirm: () => Promise<void> | void;
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Nao definido';
  }

  return new Date(value).toLocaleString('pt-BR');
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function calculateCpfCheckDigit(numbers: number[], weight: number) {
  const sum = numbers.reduce((total, number) => {
    const nextTotal = total + number * weight;
    weight -= 1;

    return nextTotal;
  }, 0);
  const remainder = (sum * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

function isValidCpf(value: string) {
  const document = value.replace(/\D/g, '');

  if (!/^\d{11}$/.test(document) || /^(\d)\1{10}$/.test(document)) {
    return false;
  }

  const digits = document.split('').map(Number);
  const firstCheck = calculateCpfCheckDigit(digits.slice(0, 9), 10);
  const secondCheck = calculateCpfCheckDigit([...digits.slice(0, 9), firstCheck], 11);

  return digits[9] === firstCheck && digits[10] === secondCheck;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (!digits) {
    return value;
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function toMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function toTimeInputValue(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function getNextWeekStartDate() {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilNextMonday = currentDay === 1 ? 7 : (8 - currentDay) % 7 || 1;

  date.setDate(date.getDate() + daysUntilNextMonday);
  date.setHours(0, 0, 0, 0);

  return toDateInputValue(date);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getEasterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function getBrazilHolidayKeys(year: number) {
  const easter = getEasterDate(year);
  const dates = [
    new Date(year, 0, 1),
    addDays(easter, -48),
    addDays(easter, -47),
    addDays(easter, -2),
    new Date(year, 3, 21),
    new Date(year, 4, 1),
    addDays(easter, 60),
    new Date(year, 8, 7),
    new Date(year, 9, 12),
    new Date(year, 10, 2),
    new Date(year, 10, 15),
    new Date(year, 10, 20),
    new Date(year, 11, 25),
  ];

  return new Set(dates.map(toDateInputValue));
}

function isHoliday(date: Date) {
  return getBrazilHolidayKeys(date.getFullYear()).has(toDateInputValue(date));
}

function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

function isFutureDateTime(value: string) {
  return new Date(value) >= new Date();
}

function isAllowedAvailabilityDate(date: Date) {
  const weekday = date.getDay();

  return weekday >= 1 && weekday <= 5 && !isHoliday(date) && !isBeforeToday(date);
}

function getWeekdayDate(weekReferenceDate: string, weekday: number) {
  return new Date(buildDateTimeForWeekday(weekReferenceDate, weekday, '00:00'));
}

function buildDateTimeForWeekday(weekReferenceDate: string, weekday: number, time: string) {
  const date = new Date(`${weekReferenceDate}T00:00:00`);
  const [hoursRaw, minutesRaw] = time.split(':');
  const offset = (weekday - date.getDay() + 7) % 7;

  date.setDate(date.getDate() + offset);
  date.setHours(Number(hoursRaw), Number(minutesRaw), 0, 0);

  return date.toISOString();
}

function getAutomaticEndTime(startTime: string) {
  const [hoursRaw, minutesRaw] = startTime.split(':');
  const date = new Date();
  date.setHours(Number(hoursRaw) + 1, Number(minutesRaw), 0, 0);

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getAppointmentDate(appointment: AppointmentRecord) {
  return new Date(appointment.scheduledStart ?? appointment.preferredDate);
}

function isSameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function isCurrentWeek(date: Date) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isAppointmentInCompletedFilter(
  appointment: AppointmentRecord,
  filter: 'week' | 'currentMonth' | 'selectedMonth',
  selectedMonth?: string,
) {
  const date = getAppointmentDate(appointment);
  const now = new Date();

  if (filter === 'week') {
    return isCurrentWeek(date);
  }

  if (filter === 'currentMonth') {
    return isSameMonth(date, now);
  }

  const selectedDate = selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : now;

  return isSameMonth(date, selectedDate);
}

function getStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SOLICITADO]: 'Solicitado',
    [AppointmentStatus.APROVADO]: 'Aprovado',
    [AppointmentStatus.REAGENDADO]: 'Reagendado',
    [AppointmentStatus.CANCELADO]: 'Cancelado',
    [AppointmentStatus.CONCLUIDO]: 'Concluido',
  };

  return labels[status];
}

function getStatusClassName(status: AppointmentStatus) {
  const classes: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SOLICITADO]: 'status-requested',
    [AppointmentStatus.APROVADO]: 'status-approved',
    [AppointmentStatus.REAGENDADO]: 'status-rescheduled',
    [AppointmentStatus.CANCELADO]: 'status-canceled',
    [AppointmentStatus.CONCLUIDO]: 'status-completed',
  };

  return classes[status];
}

function canApproveAppointmentStatus(status: AppointmentStatus) {
  return status === AppointmentStatus.SOLICITADO || status === AppointmentStatus.REAGENDADO;
}

function getNotificationClassName(notification: { title: string; readAt?: string | null }) {
  const normalizedTitle = notification.title.toLowerCase();

  if (normalizedTitle.includes('cancelado')) {
    return 'notification-canceled';
  }

  if (normalizedTitle.includes('reagendado')) {
    return 'notification-rescheduled';
  }

  if (normalizedTitle.includes('aprovado')) {
    return 'notification-approved';
  }

  if (normalizedTitle.includes('concluido') || normalizedTitle.includes('concluído')) {
    return 'notification-completed';
  }

  return 'notification-info';
}

function normalizeClassification(value?: string | null) {
  return value?.trim() || defaultServiceClassification;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function App() {
  const [loginDocument, setLoginDocument] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registrationForm, setRegistrationForm] = useState(initialRequesterRegistrationForm);
  const [registrationErrors, setRegistrationErrors] = useState<Partial<Record<keyof typeof initialRequesterRegistrationForm, string>>>({});
  const [, setLoading] = useState(true);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [data, setData] = useState<DashboardPayload>(emptyData);
  const [dataError, setDataError] = useState('');
  const localMessages = useLocalMessages();
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [propertyForm, setPropertyForm] = useState(initialPropertyForm);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [weeklyForm, setWeeklyForm] = useState(initialWeeklyForm);
  const [selectedWeeklyWeekday, setSelectedWeeklyWeekday] = useState(1);
  const [rescheduleForm, setRescheduleForm] = useState(initialRescheduleForm);
  const [cancelForm, setCancelForm] = useState(initialCancelForm);
  const [selectedProtocol, setSelectedProtocol] = useState<AppointmentRecord | null>(null);
  const [activeAgendaActionId, setActiveAgendaActionId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState<UserRole | ''>('');
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [requesters, setRequesters] = useState<UserRecord[]>([]);
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [requesterProperties, setRequesterProperties] = useState<PropertyRecord[]>([]);
  const [, setSelectedPropertyMunicipalityId] = useState('');
  const [, setLoadingRequesters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [activeSection, setActiveSection] = useState<SectionKey>(() => {
    if (typeof window === 'undefined') {
      return 'novo';
    }

    const storedSection = window.localStorage.getItem('agendamento_atendimento_section');

    if (
      storedSection === 'novo' ||
      storedSection === 'protocolos' ||
      storedSection === 'notificacoes' ||
      storedSection === 'propriedades' ||
      storedSection === 'atendimentos' ||
      storedSection === 'agenda' ||
      storedSection === 'usuarios' ||
      storedSection === 'servicos'
    ) {
      return storedSection as SectionKey;
    }

    return 'novo';
  });
  const [requesterStep, setRequesterStep] = useState<'property' | 'service' | 'time' | 'confirm'>('property');
  const [requesterPeriod, setRequesterPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [selectedRequesterMunicipalityId, setSelectedRequesterMunicipalityId] = useState('');
  const [selectedServiceClassification, setSelectedServiceClassification] = useState(defaultServiceClassification);
  const [adminServiceClassificationFilter, setAdminServiceClassificationFilter] = useState('all');
  const [agendaView, setAgendaView] = useState<'next' | 'release' | 'booked'>('next');
  const [agendaMonth, setAgendaMonth] = useState(toMonthInputValue(new Date()));
  const [selectedAgendaExtensionistId, setSelectedAgendaExtensionistId] = useState('');
  const [selectedAgendaMunicipalityId, setSelectedAgendaMunicipalityId] = useState('');
  const [completedFilter, setCompletedFilter] = useState<'week' | 'currentMonth' | 'selectedMonth'>('week');
  const [completedMonth, setCompletedMonth] = useState(toMonthInputValue(new Date()));

  const isRequester = currentUser?.role === UserRole.SOLICITANTE;
  const isExtensionist = currentUser?.role === UserRole.EXTENSIONISTA;
  const isAdmin = currentUser?.role === UserRole.ADMINISTRADOR;

  const visibleAppointments = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (isAdmin) {
      return data.appointments;
    }

    if (isExtensionist) {
      return data.appointments.filter(
        (appointment) =>
          appointment.extensionistId === currentUser.id ||
          appointment.availability?.extensionistId === currentUser.id,
      );
    }

    return data.appointments.filter(
      (appointment) =>
        appointment.requesterId === currentUser.id &&
        appointment.status !== AppointmentStatus.CANCELADO,
    );
  }, [currentUser, data.appointments, isAdmin, isExtensionist]);

  const myProperties = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return isAdmin ? data.properties : data.properties.filter((property) => property.ownerId === currentUser.id);
  }, [currentUser, data.properties, isAdmin]);

  const activeExtensionists = useMemo(
    () => data.users.filter((user) => user.role === UserRole.EXTENSIONISTA && user.isActive),
    [data.users],
  );
  const filteredAdminUsers = useMemo(
    () => (adminUserRoleFilter ? data.users.filter((user) => user.role === adminUserRoleFilter) : []),
    [adminUserRoleFilter, data.users],
  );
  const selectedAdminUser = filteredAdminUsers.find((user) => user.id === selectedAdminUserId);
  const selectedAgendaExtensionist = activeExtensionists.find((user) => user.id === selectedAgendaExtensionistId);
  const managedAgendaExtensionistId = isAdmin ? selectedAgendaExtensionistId : currentUser?.id ?? '';
  const currentUserMunicipalities = useMemo(
    () => currentUser?.attendanceMunicipalities?.map((item) => item.municipality) ?? [],
    [currentUser],
  );
  const selectedAgendaExtensionistMunicipalities = useMemo(
    () => selectedAgendaExtensionist?.attendanceMunicipalities?.map((item) => item.municipality) ?? [],
    [selectedAgendaExtensionist],
  );
  const managedAgendaMunicipalities = useMemo(
    () => (isAdmin ? selectedAgendaExtensionistMunicipalities : currentUserMunicipalities),
    [currentUserMunicipalities, isAdmin, selectedAgendaExtensionistMunicipalities],
  );
  const selectedAgendaMunicipality = managedAgendaMunicipalities.find(
    (municipality) => municipality.id === selectedAgendaMunicipalityId,
  );
  const selectedRequester = useMemo(
    () => requesters.find((requester) => requester.id === selectedRequesterId),
    [requesters, selectedRequesterId],
  );
  const managedMunicipalityKey = managedAgendaMunicipalities.map((municipality) => municipality.id).join('|');
  const hasAgendaContext = isAdmin
    ? Boolean(selectedAgendaExtensionistId && selectedAgendaMunicipalityId)
    : Boolean(selectedAgendaMunicipalityId);

  const managedExtensionistAvailability = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (!managedAgendaExtensionistId) {
      return [];
    }

    return data.availability.filter((slot) => slot.extensionistId === managedAgendaExtensionistId);
  }, [currentUser, data.availability, managedAgendaExtensionistId]);

  const myAvailability = useMemo(() => {
    if (!selectedAgendaMunicipalityId) {
      return [];
    }

    return managedExtensionistAvailability.filter((slot) => slot.municipalityId === selectedAgendaMunicipalityId);
  }, [managedExtensionistAvailability, selectedAgendaMunicipalityId]);

  const uniqueServices = useMemo(() => {
    const names = new Set<string>();

    return data.services.filter((service) => {
      const key = service.name.trim().toLocaleLowerCase('pt-BR');

      if (names.has(key)) {
        return false;
      }

      names.add(key);
      return true;
    });
  }, [data.services]);
  const adminServiceClassificationOptions = useMemo(() => {
    const classifications = Array.from(
      new Set(uniqueServices.map((service) => normalizeClassification(service.classification))),
    );

    return classifications.sort((first, second) => {
      const firstIndex = serviceClassificationOrder.indexOf(first);
      const secondIndex = serviceClassificationOrder.indexOf(second);

      if (firstIndex === -1 && secondIndex === -1) {
        return first.localeCompare(second, 'pt-BR');
      }

      if (firstIndex === -1) {
        return 1;
      }

      if (secondIndex === -1) {
        return -1;
      }

      return firstIndex - secondIndex;
    });
  }, [uniqueServices]);
  const adminFilteredServices =
    adminServiceClassificationFilter === 'all'
      ? uniqueServices
      : uniqueServices.filter(
          (service) => normalizeClassification(service.classification) === adminServiceClassificationFilter,
        );

  const operationalAppointments = useMemo(() => {
    const filterByMunicipality = (appointment: AppointmentRecord) =>
      !selectedAgendaMunicipalityId || appointment.availability?.municipalityId === selectedAgendaMunicipalityId;

    if (!isAdmin) {
      return visibleAppointments.filter(filterByMunicipality);
    }

    if (!selectedAgendaExtensionistId) {
      return [];
    }

    return visibleAppointments.filter(
      (appointment) =>
        filterByMunicipality(appointment) &&
        (appointment.extensionistId === selectedAgendaExtensionistId ||
          appointment.availability?.extensionistId === selectedAgendaExtensionistId),
    );
  }, [isAdmin, selectedAgendaExtensionistId, selectedAgendaMunicipalityId, visibleAppointments]);
  const adminProtocolAppointments = useMemo(() => {
    if (!isAdmin || !selectedAgendaExtensionistId) {
      return visibleAppointments;
    }

    return visibleAppointments.filter(
      (appointment) =>
        (!selectedAgendaMunicipalityId || appointment.availability?.municipalityId === selectedAgendaMunicipalityId) &&
        (appointment.extensionistId === selectedAgendaExtensionistId ||
          appointment.availability?.extensionistId === selectedAgendaExtensionistId),
    );
  }, [isAdmin, selectedAgendaExtensionistId, selectedAgendaMunicipalityId, visibleAppointments]);
  const adminProtocolOpenCount = adminProtocolAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.SOLICITADO,
  ).length;
  const adminProtocolActiveCount = adminProtocolAppointments.filter(
    (appointment) =>
      appointment.status !== AppointmentStatus.CONCLUIDO &&
      appointment.status !== AppointmentStatus.CANCELADO,
  ).length;
  const adminProtocolDoneCount = adminProtocolAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CONCLUIDO,
  ).length;
  const protocolAppointments = useMemo(() => {
    if (!isExtensionist) {
      return visibleAppointments;
    }

    if (!selectedAgendaMunicipalityId) {
      return [];
    }

    return visibleAppointments.filter(
      (appointment) => appointment.availability?.municipalityId === selectedAgendaMunicipalityId,
    );
  }, [isExtensionist, selectedAgendaMunicipalityId, visibleAppointments]);

  const openAppointments = operationalAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.SOLICITADO,
  );
  const approvedAppointments = operationalAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.APROVADO,
  );
  const activeWorkAppointments = operationalAppointments.filter(
    (appointment) =>
      appointment.status !== AppointmentStatus.CONCLUIDO &&
      appointment.status !== AppointmentStatus.CANCELADO,
  );

  const getAvailabilityUsage = useCallback(
    (availabilityId: string) =>
      data.appointments.filter(
        (appointment) =>
          appointment.availabilityId === availabilityId &&
          [
            AppointmentStatus.SOLICITADO,
            AppointmentStatus.APROVADO,
            AppointmentStatus.REAGENDADO,
            AppointmentStatus.CONCLUIDO,
          ].includes(appointment.status),
      ).length,
    [data.appointments],
  );

  const getActiveAppointmentsForSlot = useCallback(
    (availabilityId: string) =>
      visibleAppointments.filter(
        (appointment) =>
          appointment.availabilityId === availabilityId &&
          [
            AppointmentStatus.SOLICITADO,
            AppointmentStatus.APROVADO,
            AppointmentStatus.REAGENDADO,
          ].includes(appointment.status),
      ),
    [visibleAppointments],
  );

  const availableSlots = useMemo(
    () =>
      data.availability.filter(
        (slot) => isFutureDateTime(slot.startDateTime) && getAvailabilityUsage(slot.id) < slot.capacity,
      ),
    [data.availability, getAvailabilityUsage],
  );

  const activeServices = useMemo(() => uniqueServices.filter((service) => service.active), [uniqueServices]);
  const serviceClassifications = useMemo(() => {
    const classifications = Array.from(
      new Set(activeServices.map((service) => normalizeClassification(service.classification))),
    );

    return classifications.sort((first, second) => {
      const firstIndex = serviceClassificationOrder.indexOf(first);
      const secondIndex = serviceClassificationOrder.indexOf(second);

      if (firstIndex === -1 && secondIndex === -1) {
        return first.localeCompare(second, 'pt-BR');
      }

      if (firstIndex === -1) {
        return 1;
      }

      if (secondIndex === -1) {
        return -1;
      }

      return firstIndex - secondIndex;
    });
  }, [activeServices]);
  const activeServiceClassification = serviceClassifications.includes(selectedServiceClassification)
    ? selectedServiceClassification
    : (serviceClassifications[0] ?? defaultServiceClassification);
  const filteredServicesByClassification = activeServices.filter(
    (service) => normalizeClassification(service.classification) === activeServiceClassification,
  );
  const selectedProperty = myProperties.find((property) => property.id === appointmentForm.propertyId);
  const selectedService = activeServices.find((service) => service.id === appointmentForm.serviceId);
  const selectedSlot = data.availability.find((slot) => slot.id === appointmentForm.availabilityId);
  const requesterAvailableMunicipalities = useMemo(() => {
    const municipalities = new Map<string, { id: string; name: string; state: string; total: number }>();

    availableSlots.forEach((slot) => {
      if (!slot.municipality) {
        return;
      }

      const current = municipalities.get(slot.municipality.id);

      municipalities.set(slot.municipality.id, {
        id: slot.municipality.id,
        name: slot.municipality.name,
        state: slot.municipality.state,
        total: (current?.total ?? 0) + 1,
      });
    });

    return Array.from(municipalities.values()).sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
  }, [availableSlots]);
  const selectedRequesterMunicipality = requesterAvailableMunicipalities.find(
    (municipality) => municipality.id === selectedRequesterMunicipalityId,
  );
  const requesterMunicipalitySlots = selectedRequesterMunicipalityId
    ? availableSlots.filter((slot) => slot.municipalityId === selectedRequesterMunicipalityId)
    : [];
  const upcomingAvailability = myAvailability.filter((slot) => isFutureDateTime(slot.startDateTime));
  const bookedAgendaAppointments = operationalAppointments.filter(
    (appointment) =>
      appointment.availabilityId &&
      myAvailability.some((slot) => slot.id === appointment.availabilityId) &&
      [
        AppointmentStatus.SOLICITADO,
        AppointmentStatus.APROVADO,
        AppointmentStatus.REAGENDADO,
      ].includes(appointment.status),
  );
  const completedAgendaAppointments = operationalAppointments.filter(
    (appointment) =>
      appointment.status === AppointmentStatus.CONCLUIDO &&
      appointment.availabilityId &&
      myAvailability.some((slot) => slot.id === appointment.availabilityId),
  );
  const filteredCompletedAppointments = completedAgendaAppointments.filter((appointment) =>
    isAppointmentInCompletedFilter(appointment, completedFilter, completedMonth),
  );
  const requesterPeriodSlots = requesterMunicipalitySlots.filter((slot) => getSlotPeriod(slot) === requesterPeriod);
  const groupedRequesterPeriodSlots = useMemo(() => {
    const groups = new Map<string, { key: string; startDateTime: string; slots: typeof requesterPeriodSlots }>();

    requesterPeriodSlots.forEach((slot) => {
      const key = slot.startDateTime;
      const current = groups.get(key);

      if (current) {
        current.slots.push(slot);
        return;
      }

      groups.set(key, {
        key,
        startDateTime: slot.startDateTime,
        slots: [slot],
      });
    });

    return Array.from(groups.values()).sort(
      (first, second) => new Date(first.startDateTime).getTime() - new Date(second.startDateTime).getTime(),
    );
  }, [requesterPeriodSlots]);
  const selectableWeeklyWeekdays = [1, 2, 3, 4, 5].filter((weekday) =>
    isAllowedAvailabilityDate(getWeekdayDate(weeklyForm.weekStartDate, weekday)),
  );
  const activeWeeklyWeekday = selectableWeeklyWeekdays.includes(selectedWeeklyWeekday)
    ? selectedWeeklyWeekday
    : (selectableWeeklyWeekdays[0] ?? 1);
  const activeWeeklyCapacity = weeklyForm.dayCapacity[activeWeeklyWeekday] ?? { morning: 0, afternoon: 0 };
  const weeklyTimeBlocksCount = activeWeeklyCapacity.morning + activeWeeklyCapacity.afternoon;
  const getReleasedSlotsCountForDate = useCallback(
    (date: Date) => {
      const dateKey = toDateInputValue(date);

      return managedExtensionistAvailability.filter(
        (slot) => toDateInputValue(new Date(slot.startDateTime)) === dateKey,
      ).length;
    },
    [managedExtensionistAvailability],
  );
  function getReleasedSlotsForDateAndPeriod(date: Date, period: 'morning' | 'afternoon') {
    const dateKey = toDateInputValue(date);

    return managedExtensionistAvailability.filter(
      (slot) => toDateInputValue(new Date(slot.startDateTime)) === dateKey && getSlotPeriod(slot) === period,
    );
  }

  const activeReleasedSlotsCount = getReleasedSlotsCountForDate(
    getWeekdayDate(weeklyForm.weekStartDate, activeWeeklyWeekday),
  );
  const activeDayReachedLimit = activeReleasedSlotsCount >= 4;
  const monthlyAvailabilityCount = myAvailability.filter((slot) => slot.startDateTime.slice(0, 7) === agendaMonth).length;
  const releaseWeekStart = new Date(`${weeklyForm.weekStartDate}T00:00:00`);
  const releaseWeekEnd = addDays(releaseWeekStart, 4);
  const releaseWeekLabel = `${releaseWeekStart.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })} a ${releaseWeekEnd.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`;
  const previousReleaseWeekStart = addDays(releaseWeekStart, -7);
  const canGoToPreviousReleaseWeek = !isBeforeToday(previousReleaseWeekStart);
  const agendaCalendarDays = useMemo(() => {
    const [year, month] = agendaMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const firstGridDate = new Date(monthStart);
    const lastGridDate = new Date(monthEnd);

    firstGridDate.setDate(monthStart.getDate() - monthStart.getDay());
    lastGridDate.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const sortedSlots = myAvailability
      .filter((slot) => {
        const hasActiveAppointment = getActiveAppointmentsForSlot(slot.id).length > 0;
        const hasFreeCapacity = getAvailabilityUsage(slot.id) < slot.capacity;

        return isFutureDateTime(slot.startDateTime) && (hasActiveAppointment || hasFreeCapacity);
      })
      .slice()
      .sort((first, second) => new Date(first.startDateTime).getTime() - new Date(second.startDateTime).getTime());
    const days = [];

    for (const date = new Date(firstGridDate); date <= lastGridDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const key = toDateInputValue(currentDate);
      const slots = sortedSlots.filter((slot) => slot.startDateTime.slice(0, 10) === key);

      days.push({
        key,
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === monthStart.getMonth(),
        isToday: key === toDateInputValue(new Date()),
        slots,
      });
    }

    return days;
  }, [agendaMonth, myAvailability, getActiveAppointmentsForSlot, getAvailabilityUsage]);
  const attendanceCalendarDays = useMemo(() => {
    const [year, month] = agendaMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const firstGridDate = new Date(monthStart);
    const lastGridDate = new Date(monthEnd);

    firstGridDate.setDate(monthStart.getDate() - monthStart.getDay());
    lastGridDate.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const sortedAppointments = activeWorkAppointments
      .slice()
      .sort(
        (first, second) =>
          getAppointmentDate(first).getTime() - getAppointmentDate(second).getTime(),
      );
    const days = [];

    for (const date = new Date(firstGridDate); date <= lastGridDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const key = toDateInputValue(currentDate);
      const appointments = sortedAppointments.filter(
        (appointment) => toDateInputValue(getAppointmentDate(appointment)) === key,
      );

      days.push({
        key,
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === monthStart.getMonth(),
        isToday: key === toDateInputValue(new Date()),
        appointments,
      });
    }

    return days;
  }, [activeWorkAppointments, agendaMonth]);
  const unreadNotifications = data.notifications.filter((notification) => !notification.readAt).length;
  const menuItems = useMemo(() => {
    if (isRequester) {
      return [
        { key: 'novo' as const, label: 'Agendar', count: availableSlots.length },
        { key: 'protocolos' as const, label: 'Meus protocolos', count: visibleAppointments.length },
        { key: 'notificacoes' as const, label: 'Avisos', count: unreadNotifications },
      ];
    }

    if (isExtensionist) {
      return [
        { key: 'atendimentos' as const, label: 'Atendimentos', count: activeWorkAppointments.length },
        { key: 'agenda' as const, label: 'Agenda', count: monthlyAvailabilityCount },
        { key: 'protocolos' as const, label: 'Protocolos', count: visibleAppointments.length },
        { key: 'propriedades' as const, label: 'Propriedades', count: requesters.length },
      ];
    }

    if (isAdmin) {
      return [
        { key: 'atendimentos' as const, label: 'Atendimentos', count: activeWorkAppointments.length },
        { key: 'agenda' as const, label: 'Agenda', count: monthlyAvailabilityCount },
        { key: 'protocolos' as const, label: 'Protocolos', count: visibleAppointments.length },
        { key: 'usuarios' as const, label: 'Usuarios', count: data.users.length },
        { key: 'servicos' as const, label: 'Servicos', count: uniqueServices.length },
      ];
    }

    return [];
  }, [
    activeWorkAppointments.length,
    availableSlots.length,
    data.users.length,
    isAdmin,
    isExtensionist,
    isRequester,
    monthlyAvailabilityCount,
    myProperties.length,
    uniqueServices.length,
    unreadNotifications,
    visibleAppointments.length,
  ]);

  function changeAgendaMonth(direction: -1 | 1) {
    const [year, month] = agendaMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + direction, 1);
    setAgendaMonth(toMonthInputValue(nextDate));
  }

  function getCalendarDayTooltip(slots: typeof myAvailability) {
    if (slots.length === 0) {
      return 'Sem horarios cadastrados';
    }

    return slots
      .map((slot) => {
        const time = new Date(slot.startDateTime).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const appointments = getActiveAppointmentsForSlot(slot.id);
        const status = appointments.length > 0 ? appointments.map((appointment) => appointment.protocolCode).join(', ') : 'Livre';

        return `${time} - ${status}`;
      })
      .join('\n');
  }

  function getAttendanceDayTooltip(appointments: AppointmentRecord[]) {
    if (appointments.length === 0) {
      return 'Sem atendimentos neste dia';
    }

    return appointments
      .map((appointment) => {
        const time = getAppointmentDate(appointment).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return `${time} - ${appointment.protocolCode} - ${getStatusLabel(appointment.status)}`;
      })
      .join('\n');
  }

  function getRequesterStepNumber() {
    const steps: Record<typeof requesterStep, number> = {
      property: 1,
      service: 2,
      time: 3,
      confirm: 4,
    };

    return steps[requesterStep];
  }

  function changeReleaseWeek(direction: -1 | 1) {
    setWeeklyForm((current) => {
      const currentDate = new Date(`${current.weekStartDate}T00:00:00`);
      const nextDate = addDays(currentDate, direction * 7);

      return {
        ...current,
        weekStartDate: toDateInputValue(nextDate),
      };
    });
    setSelectedWeeklyWeekday(1);
  }

  function updateWeekdayCapacity(weekday: number, period: 'morning' | 'afternoon', value: number) {
    const nextValue = Math.max(0, Math.min(2, value));

    setWeeklyForm((current) => ({
      ...current,
      dayCapacity: {
        ...current.dayCapacity,
        [weekday]: {
          morning: current.dayCapacity[weekday]?.morning ?? 0,
          afternoon: current.dayCapacity[weekday]?.afternoon ?? 0,
          [period]: nextValue,
        },
      },
    }));
  }

  function updateWeekdayTime(weekday: number, period: 'morning' | 'afternoon', index: number, value: string) {
    setWeeklyForm((current) => {
      const currentTimes = current.dayTimes[weekday]?.[period] ?? ['07:00', '09:00'];
      const nextTimes = [...currentTimes];
      nextTimes[index] = value;

      return {
        ...current,
        dayTimes: {
          ...current.dayTimes,
          [weekday]: {
            morning: current.dayTimes[weekday]?.morning ?? ['07:00', '09:00'],
            afternoon: current.dayTimes[weekday]?.afternoon ?? ['13:00', '15:00'],
            [period]: nextTimes,
          },
        },
      };
    });
  }

  function scrollToAppointmentAction() {
    window.setTimeout(() => {
      globalThis.document.getElementById('appointment-action-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  }

  function openProtocolDetail(appointment: AppointmentRecord) {
    setSelectedProtocol(appointment);
    setActiveSection('protocolos');
    setActiveAgendaActionId(null);
    window.setTimeout(() => {
      globalThis.document.getElementById('protocol-detail-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  }

  function getAvailableRescheduleSlots(appointment: AppointmentRecord) {
    const appointmentExtensionistId =
      appointment.availability?.extensionistId ?? appointment.extensionistId ?? managedAgendaExtensionistId;
    const appointmentMunicipalityId = appointment.availability?.municipalityId ?? selectedAgendaMunicipalityId;

    if (!appointmentExtensionistId) {
      return [];
    }

    return data.availability.filter(
      (slot) =>
        slot.extensionistId === appointmentExtensionistId &&
        (!appointmentMunicipalityId || slot.municipalityId === appointmentMunicipalityId) &&
        slot.id !== appointment.availabilityId &&
        isFutureDateTime(slot.startDateTime) &&
        getAvailabilityUsage(slot.id) < slot.capacity,
    );
  }

  function getSlotDateValue(slot?: { startDateTime: string }) {
    return slot?.startDateTime.slice(0, 10) ?? '';
  }

  function getSlotPeriod(slot?: { startDateTime: string }) {
    if (!slot) {
      return 'morning';
    }

    const hour = new Date(slot.startDateTime).getHours();

    return hour >= 6 && hour < 12 ? 'morning' : 'afternoon';
  }

  function getFilteredRescheduleSlots() {
    const appointment = visibleAppointments.find(
      (item) => item.protocolCode === rescheduleForm.protocolCode,
    );

    if (!appointment) {
      return [];
    }

    return getAvailableRescheduleSlots(appointment).filter((slot) => {
      const slotDate = slot.startDateTime.slice(0, 10);
      const slotPeriod = getSlotPeriod(slot);

      return slotDate === rescheduleForm.date && slotPeriod === rescheduleForm.period;
    });
  }

  function updateRescheduleDate(date: string) {
    const appointment = visibleAppointments.find(
      (item) => item.protocolCode === rescheduleForm.protocolCode,
    );
    const nextSlots = appointment
      ? getAvailableRescheduleSlots(appointment).filter(
          (slot) => slot.startDateTime.slice(0, 10) === date && getSlotPeriod(slot) === rescheduleForm.period,
        )
      : [];

    setRescheduleForm((current) => ({
      ...current,
      date,
      availabilityId: nextSlots[0]?.id ?? '',
    }));
  }

  function updateReschedulePeriod(period: string) {
    const appointment = visibleAppointments.find(
      (item) => item.protocolCode === rescheduleForm.protocolCode,
    );
    const nextSlots = appointment
      ? getAvailableRescheduleSlots(appointment).filter(
          (slot) => slot.startDateTime.slice(0, 10) === rescheduleForm.date && getSlotPeriod(slot) === period,
        )
      : [];

    setRescheduleForm((current) => ({
      ...current,
      period,
      availabilityId: nextSlots[0]?.id ?? '',
    }));
  }

  function openRescheduleForm(appointment: AppointmentRecord) {
    const slots = getAvailableRescheduleSlots(appointment);

    if (slots.length === 0) {
      localMessages.addMessage('error', 'Nao ha horario livre para reagendar. Libere um novo horario na agenda.');
      return;
    }

    const firstSlot = slots[0];
    setCancelForm(initialCancelForm);
    setActiveSection('atendimentos');
    setRescheduleForm({
      protocolCode: appointment.protocolCode,
      date: getSlotDateValue(firstSlot),
      period: getSlotPeriod(firstSlot),
      availabilityId: firstSlot.id,
      justification: '',
    });
    scrollToAppointmentAction();
  }

  function openCancelForm(appointment: AppointmentRecord) {
    setRescheduleForm(initialRescheduleForm);
    setActiveSection('atendimentos');
    setCancelForm({
      protocolCode: appointment.protocolCode,
      justification: '',
    });
    scrollToAppointmentAction();
  }

  async function refreshData(roleOverride?: UserRole) {
    try {
      setDataError('');
      const nextData = await fetchDashboardData(roleOverride ?? currentUser?.role);
      setData(nextData);
    } catch (error) {
      setDataError(getApiErrorMessage(error, 'Nao foi possivel carregar os dados do backend.'));
      console.error(error);
    }
  }

  async function handleMenuClick(section: SectionKey) {
    setActiveSection(section);
    setLoading(true);

    try {
      if (section === 'propriedades' && isExtensionist) {
        await loadRequesters();
      }

      await refreshData();
    } finally {
      setLoading(false);
    }
  }

  async function loadRequesters() {
    try {
      setLoadingRequesters(true);
      const nextRequesters = await fetchRequesters();
      setRequesters(nextRequesters);

      if (nextRequesters.length > 0) {
        const nextRequesterId = nextRequesters.some((requester) => requester.id === selectedRequesterId)
          ? selectedRequesterId
          : nextRequesters[0].id;

        setSelectedRequesterId(nextRequesterId);
        void loadRequesterProperties(nextRequesterId);
      } else {
        setSelectedRequesterId('');
        setRequesterProperties([]);
      }
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel carregar os solicitantes.'));
      console.error(error);
    } finally {
      setLoadingRequesters(false);
    }
  }

  async function loadRequesterProperties(ownerId?: string) {
    if (!ownerId) {
      setRequesterProperties([]);
      return;
    }

    try {
      const properties = await fetchProperties(ownerId);
      setRequesterProperties(properties);
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel carregar propriedades do solicitante.'));
      console.error(error);
    }
  }

  function handleRequesterSelection(ownerId: string) {
    setSelectedRequesterId(ownerId);
    setSelectedPropertyMunicipalityId('');
    setPropertyForm((current) => ({ ...current, city: '', state: 'MT' }));
    void loadRequesterProperties(ownerId);
  }

  useEffect(() => {
    let active = true;
    const token = hydrateAuthToken();

    async function load() {
      setLoading(true);

      try {
        if (token) {
          const me = await fetchCurrentUser();
          const nextData = await fetchDashboardData(me.role);

          if (active) {
            setCurrentUser(me);
            setData(nextData);
          }
        }
      } catch (error) {
        if (active) {
          setAuthToken(null);
          setCurrentUser(null);
          setData(emptyData);
          setDataError('Sessao expirada ou backend indisponivel.');
        }

        console.error(error);
      } finally {
        if (active) {
          setSessionChecking(false);
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('agendamento_atendimento_section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    localMessages.clearMessages();
  }, [activeSection]);

  useEffect(() => {
    if (isExtensionist && activeSection === 'propriedades' && requesters.length === 0) {
      void loadRequesters();
    }
  }, [isExtensionist, activeSection, requesters.length]);

  useEffect(() => {
    setAppointmentForm((current) => ({
      ...current,
      propertyId: current.propertyId || myProperties[0]?.id || '',
    }));
  }, [myProperties]);

  useEffect(() => {
    if (requesterAvailableMunicipalities.length === 0) {
      setSelectedRequesterMunicipalityId('');
      setAppointmentForm((current) => ({ ...current, availabilityId: '', preferredDate: '' }));
      return;
    }

    if (
      selectedRequesterMunicipalityId &&
      requesterAvailableMunicipalities.some((municipality) => municipality.id === selectedRequesterMunicipalityId)
    ) {
      return;
    }

    setSelectedRequesterMunicipalityId(requesterAvailableMunicipalities[0].id);
    setAppointmentForm((current) => ({ ...current, availabilityId: '', preferredDate: '' }));
  }, [requesterAvailableMunicipalities, selectedRequesterMunicipalityId]);

  useEffect(() => {
    if (serviceClassifications.length === 0) {
      return;
    }

    if (!serviceClassifications.includes(selectedServiceClassification)) {
      setSelectedServiceClassification(serviceClassifications[0]);
    }
  }, [selectedServiceClassification, serviceClassifications]);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedAgendaExtensionistId('');
      return;
    }

    if (
      selectedAgendaExtensionistId &&
      !activeExtensionists.some((extensionist) => extensionist.id === selectedAgendaExtensionistId)
    ) {
      setSelectedAgendaExtensionistId('');
    }
  }, [activeExtensionists, isAdmin, selectedAgendaExtensionistId]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedAgendaMunicipalityId('');
      return;
    }

    if (isAdmin && !selectedAgendaExtensionistId) {
      setSelectedAgendaMunicipalityId('');
      return;
    }

    if (managedAgendaMunicipalities.length === 0) {
      setSelectedAgendaMunicipalityId('');
      return;
    }

    if (!managedAgendaMunicipalities.some((municipality) => municipality.id === selectedAgendaMunicipalityId)) {
      setSelectedAgendaMunicipalityId(managedAgendaMunicipalities[0].id);
    }
  }, [
    currentUser,
    isAdmin,
    managedAgendaMunicipalities,
    managedMunicipalityKey,
    selectedAgendaExtensionistId,
    selectedAgendaMunicipalityId,
  ]);

  useEffect(() => {
    if (!currentUser || menuItems.length === 0) {
      return;
    }

    if (!menuItems.some((item) => item.key === activeSection)) {
      setActiveSection(menuItems[0].key);
    }
  }, [activeSection, currentUser, menuItems]);

  useEffect(() => {
    if (!selectedAdminUserId) {
      return;
    }

    if (!filteredAdminUsers.some((user) => user.id === selectedAdminUserId)) {
      setSelectedAdminUserId('');
    }
  }, [filteredAdminUsers, selectedAdminUserId]);

  function getRegistrationFormErrors(form: typeof initialRequesterRegistrationForm) {
    const errors: Partial<Record<keyof typeof initialRequesterRegistrationForm, string>> = {};
    const document = form.document.replace(/\D/g, '');
    const phone = form.phone.replace(/\D/g, '');

    if (!document) {
      errors.document = 'Campo obrigatório';
    } else if (!isValidCpf(document)) {
      errors.document = 'CPF inválido';
    }

    if (!form.name.trim()) {
      errors.name = 'Campo obrigatório';
    }

    if (!form.password) {
      errors.password = 'Campo obrigatório';
    } else if (form.password.length < 8) {
      errors.password = 'Senha deve ter pelo menos 8 caracteres';
    } else if (form.password.replace(/\D/g, '') === document || form.password === '12345678') {
      errors.password = 'Use uma senha diferente do CPF e de senhas comuns';
    }

    if (!phone) {
      errors.phone = 'Campo obrigatório';
    } else if (phone.length < 10) {
      errors.phone = 'Telefone inválido';
    }

    if (!form.community.trim()) {
      errors.community = 'Campo obrigatório';
    }

    if (!form.city.trim()) {
      errors.city = 'Campo obrigatório';
    }

    return errors;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');

    const cleanDocument = loginDocument.replace(/\D/g, '');
    if (!isValidCpf(cleanDocument)) {
      setLoginError('Informe um CPF válido');
      return;
    }

    setLoginSubmitting(true);

    try {
      const response = await login(cleanDocument, password);
      setAuthToken(response.token);
      setCurrentUser(response.user);
      setActiveSection(response.user.role === UserRole.SOLICITANTE ? 'novo' : 'atendimentos');
      await refreshData(response.user.role);
    } catch (error) {
      setLoginError(getApiErrorMessage(error, 'Falha no login. Confira documento e senha.'));
      console.error(error);
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleRequesterRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');

    const errors = getRegistrationFormErrors(registrationForm);
    if (Object.keys(errors).length > 0) {
      setRegistrationErrors(errors);
      return;
    }

    setRegistrationErrors({});
    setLoginSubmitting(true);

    const cleanDocument = registrationForm.document.replace(/\D/g, '');

    try {
      await registerRequester({
        document: cleanDocument,
        name: registrationForm.name,
        password: registrationForm.password,
        phone: registrationForm.phone,
        community: registrationForm.community,
        city: registrationForm.city,
      });

      const response = await login(cleanDocument, registrationForm.password);
      setAuthToken(response.token);
      setCurrentUser(response.user);
      setRegistrationForm(initialRequesterRegistrationForm);
      setActiveSection('novo');
      localMessages.addMessage('success', 'Cadastro criado com sucesso.');
      await refreshData(response.user.role);
    } catch (error) {
      const backendMessage = getApiErrorMessage(error, 'Nao foi possivel concluir o cadastro.');
      if (backendMessage.includes('Ja existe cadastro')) {
        setRegistrationErrors({ document: 'CPF ja cadastrado' });
      } else if (backendMessage.includes('CPF invalido')) {
        setRegistrationErrors({ document: 'CPF invalido' });
      } else if (backendMessage.includes('Telefone')) {
        setRegistrationErrors({ phone: backendMessage });
      } else if (backendMessage.includes('Preencha')) {
        setRegistrationErrors(getRegistrationFormErrors(registrationForm));
      } else {
        setLoginError(backendMessage);
      }
      console.error(error);
    } finally {
      setLoginSubmitting(false);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setAuthToken(null);
    setData(emptyData);
    setActiveSection('novo');
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    try {
      const appointment = await createAppointment({
        requesterId: currentUser.id,
        serviceId: appointmentForm.serviceId,
        propertyId: appointmentForm.propertyId,
        availabilityId: appointmentForm.availabilityId || undefined,
        preferredDate: new Date(appointmentForm.preferredDate).toISOString(),
        notes: appointmentForm.notes,
      });

      localMessages.addMessage('success', `Protocolo gerado: ${appointment.protocolCode}`);
      setAppointmentForm((current) => ({ ...current, availabilityId: '', preferredDate: '', notes: '' }));
      setSelectedRequesterMunicipalityId('');
      setRequesterStep('property');
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel gerar o protocolo.'));
      console.error(error);
    }
  }

  async function handleCreateProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    if (isRequester) {
      localMessages.addMessage('error', 'Solicitante nao pode cadastrar propriedades.');
      return;
    }

    const owner = isExtensionist && activeSection === 'propriedades' ? selectedRequester : currentUser;

    if (!owner) {
      localMessages.addMessage('error', 'Selecione um solicitante antes de cadastrar propriedade.');
      return;
    }

    try {
      if (editingPropertyId) {
        await updateProperty(editingPropertyId, {
          displayName: propertyForm.displayName,
          city: propertyForm.city,
          state: propertyForm.state,
          address: propertyForm.address,
          ruralRegistry: propertyForm.ruralRegistry,
          funruralCode: propertyForm.funruralCode,
          hasHabiteSe: propertyForm.hasHabiteSe,
        });

        localMessages.addMessage('success', 'Propriedade atualizada.');
      } else {
        await createProperty({
          ownerId: owner.id,
          ownerName: owner.name,
          ownerDocument: owner.document,
          ...propertyForm,
        });

        localMessages.addMessage('success', 'Propriedade cadastrada.');
      }

      setPropertyForm(initialPropertyForm);
      setEditingPropertyId(null);
      setSelectedPropertyMunicipalityId('');
      setRequesterStep('service');
      await refreshData();

      if (isExtensionist && activeSection === 'propriedades' && selectedRequesterId) {
        await loadRequesterProperties(selectedRequesterId);
      }
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, editingPropertyId ? 'Nao foi possivel atualizar a propriedade.' : 'Nao foi possivel cadastrar a propriedade.'));
      console.error(error);
    }
  }

  function handleEditProperty(property: PropertyRecord) {
    if (!isExtensionist) {
      localMessages.addMessage('error', 'Apenas extensionista pode editar propriedades.');
      return;
    }

    const selectedMunicipio = data.serviceMunicipalities.find(
      (municipality) => municipality.name === property.city && municipality.state === property.state,
    );

    setSelectedPropertyMunicipalityId(selectedMunicipio?.id ?? '');
    setPropertyForm({
      displayName: property.displayName,
      city: property.city,
      state: property.state,
      address: property.address ?? '',
      ruralRegistry: property.ruralRegistry ?? '',
      funruralCode: property.funruralCode ?? '',
      hasHabiteSe: property.hasHabiteSe ?? false,
    });
    setEditingPropertyId(property.id);
  }

  async function handleDeleteProperty(propertyId: string) {
    if (!currentUser || !isExtensionist) {
      localMessages.addMessage('error', 'Apenas extensionista pode remover propriedades.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja remover esta propriedade?')) {
      return;
    }

    try {
      await deleteProperty(propertyId);
      localMessages.addMessage('success', 'Propriedade removida com sucesso.');

      if (selectedRequesterId) {
        await loadRequesterProperties(selectedRequesterId);
      }

      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel remover propriedade.'));
      console.error(error);
    }
  }

  async function handleCreateWeeklyAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    try {
      const targetExtensionistId = isAdmin ? selectedAgendaExtensionistId : currentUser.id;

      if (!targetExtensionistId) {
        localMessages.addMessage('error', 'Selecione um extensionista para gerenciar a agenda.');
        return;
      }

      if (!selectedAgendaMunicipalityId) {
        localMessages.addMessage('error', 'Selecione um municipio de atendimento para liberar a agenda.');
        return;
      }

      const selectedWeekdays = isAllowedAvailabilityDate(getWeekdayDate(weeklyForm.weekStartDate, activeWeeklyWeekday))
        ? [activeWeeklyWeekday]
        : [];

      if (activeDayReachedLimit) {
        localMessages.addMessage('error', 'Ja existe horario liberado para esse Extensionista');
        return;
      }

      if (selectedWeekdays.length === 0) {
        localMessages.addMessage('error', 'Selecione pelo menos um dia util sem feriado.');
        return;
      }

      const requests = selectedWeekdays
        .map((weekday) => {
          const capacity = weeklyForm.dayCapacity[weekday] ?? { morning: 0, afternoon: 0 };
          const date = toDateInputValue(getWeekdayDate(weeklyForm.weekStartDate, weekday));
          const dayDate = getWeekdayDate(weeklyForm.weekStartDate, weekday);
          const times = weeklyForm.dayTimes[weekday] ?? {
            morning: ['07:00', '09:00'],
            afternoon: ['13:00', '15:00'],
          };
          const buildMissingTimeBlocks = (period: 'morning' | 'afternoon') => {
            const newSlotsRequested = Math.max(0, Math.min(2, capacity[period]));
            const releasedSlots = getReleasedSlotsForDateAndPeriod(dayDate, period);
            const releasedTimes = new Set(releasedSlots.map((slot) => toTimeInputValue(slot.startDateTime)));
            const remainingPeriodSlots = Math.max(0, 2 - releasedSlots.length);
            const availableToCreate = Math.min(newSlotsRequested, remainingPeriodSlots);

            return times[period]
              .filter((startTime) => !releasedTimes.has(startTime))
              .slice(0, availableToCreate)
              .map((startTime, index) => ({
                date,
                startTime,
                endTime: getAutomaticEndTime(startTime),
                notes:
                  weeklyForm.notes ||
                  (period === 'morning' ? `Periodo matutino ${index + 1}` : `Periodo vespertino ${index + 1}`),
              }));
          };
          const timeBlocks = [
            ...buildMissingTimeBlocks('morning'),
            ...buildMissingTimeBlocks('afternoon'),
          ];

          return { weekday, date, timeBlocks };
        })
        .filter((item) => item.timeBlocks.length > 0);

      if (requests.length === 0) {
        localMessages.addMessage('error', 'Selecione pelo menos uma vaga de manha ou tarde.');
        return;
      }

      await Promise.all(
        requests.map((request) =>
          createWeeklyAvailability({
            extensionistId: targetExtensionistId,
            municipalityId: selectedAgendaMunicipalityId,
            weekStartDate: weeklyForm.weekStartDate,
            weekdays: [request.weekday],
            startTime: request.timeBlocks[0]?.startTime ?? '07:00',
            endTime: getAutomaticEndTime(request.timeBlocks[0]?.startTime ?? '07:00'),
            timeBlocks: request.timeBlocks,
            capacity: 1,
            notes: weeklyForm.notes,
          }),
        ),
      );

      const generatedCount = requests.reduce((total, request) => total + request.timeBlocks.length, 0);

      const generatedDates = requests
        .map((request) => new Date(`${request.date}T00:00:00`).toLocaleDateString('pt-BR'))
        .join(', ');

      setWeeklyForm((current) => ({
        ...current,
        weekdays: [activeWeeklyWeekday],
      }));
      localMessages.addMessage('success', `Agenda gerada com ${generatedCount} vaga(s) para ${generatedDates}.`);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel gerar a semana.'));
      console.error(error);
    }
  }

  function requestConfirmation(dialog: ConfirmDialogState) {
    setConfirmDialog(dialog);
  }

  async function handleConfirmDialog() {
    if (!confirmDialog) {
      return;
    }

    const action = confirmDialog.onConfirm;
    setConfirmDialog(null);
    await action();
  }

  function handleDeleteAvailability(id: string) {
    requestConfirmation({
      title: 'Excluir horario',
      message: 'Deseja excluir este horario livre da agenda?',
      confirmLabel: 'Excluir',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deleteAvailability(id);
          localMessages.addMessage('success', 'Horario excluido.');
          await refreshData();
        } catch (error) {
          localMessages.addMessage('error',
            getApiErrorMessage(
              error,
              'Nao foi possivel excluir. Horarios com atendimento no historico ficam bloqueados.',
            ),
          );
          console.error(error);
        }
      },
    });
  }

  async function handleApproveAppointment(appointment: AppointmentRecord) {
    if (!currentUser) {
      return;
    }

    try {
      const targetExtensionistId =
        appointment.availability?.extensionistId ?? appointment.extensionistId ?? (isExtensionist ? currentUser.id : '');

      if (!targetExtensionistId) {
        localMessages.addMessage('error', 'Nao foi possivel identificar o extensionista do atendimento.');
        return;
      }

      await updateAppointmentStatus(appointment.protocolCode, {
        status: AppointmentStatus.APROVADO,
        extensionistId: targetExtensionistId,
      });

      localMessages.addMessage('success', `Protocolo ${appointment.protocolCode} aprovado.`);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel aprovar o atendimento.'));
      console.error(error);
    }
  }

  async function handleFinishAppointment(appointment: AppointmentRecord) {
    try {
      await updateAppointmentStatus(appointment.protocolCode, {
        status: AppointmentStatus.CONCLUIDO,
      });

      localMessages.addMessage('success', `Protocolo ${appointment.protocolCode} concluido.`);
      setSelectedProtocol(null);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel concluir o atendimento.'));
      console.error(error);
    }
  }

  async function handleCancelAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    requestConfirmation({
      title: 'Cancelar atendimento',
      message: `Deseja cancelar o protocolo ${cancelForm.protocolCode}? O solicitante sera notificado.`,
      confirmLabel: 'Cancelar protocolo',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await updateAppointmentStatus(cancelForm.protocolCode, {
            status: AppointmentStatus.CANCELADO,
            justification: cancelForm.justification,
          });

          localMessages.addMessage('success', `Protocolo ${cancelForm.protocolCode} cancelado.`);
          setCancelForm(initialCancelForm);
          await refreshData();
        } catch (error) {
          localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel cancelar o atendimento.'));
          console.error(error);
        }
      },
    });
  }

  function handlePrintProtocol(protocol: AppointmentRecord) {
    const printWindow = window.open('', '_blank', 'width=720,height=640');

    if (!printWindow) {
      localMessages.addMessage('error', 'Nao foi possivel abrir a janela de impressao.');
      return;
    }

    const protocolCode = escapeHtml(appointment.protocolCode);
    const status = escapeHtml(getStatusLabel(appointment.status));
    const service = escapeHtml(appointment.service?.name ?? 'Nao informado');
    const property = escapeHtml(appointment.property?.displayName ?? 'Nao informada');
    const requester = escapeHtml(appointment.requester?.name ?? currentUser?.name ?? 'Nao informado');
    const document = escapeHtml(formatCpf(appointment.requester?.document ?? currentUser?.document ?? 'Nao informado'));
    const date = escapeHtml(formatDate(appointment.scheduledStart ?? appointment.preferredDate));
    const extensionist = escapeHtml(appointment.extensionist?.name ?? 'Nao definido');
    const notes = escapeHtml(appointment.notes ?? 'Sem observacao');
    const justification = escapeHtml(appointment.justification ?? 'Sem justificativa');
    const issuedAt = escapeHtml(new Date().toLocaleString('pt-BR'));

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Comprovante ${protocolCode}</title>
          <style>
            @page {
              size: A4;
              margin: 14mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #eef2f6;
              color: #152238;
              font-family: Arial, Helvetica, sans-serif;
            }

            .sheet {
              min-height: 267mm;
              background: #ffffff;
              border: 1px solid #d8e0ea;
              box-shadow: 0 18px 42px rgba(21, 34, 56, 0.12);
              padding: 28px;
              position: relative;
            }

            .topline {
              height: 8px;
              background: linear-gradient(90deg, #133e75, #1f5ea8, #5f9dde);
              border-radius: 999px;
              margin-bottom: 24px;
            }

            header {
              align-items: flex-start;
              display: flex;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 1px solid #dbe4ee;
              padding-bottom: 22px;
            }

            .brand {
              display: grid;
              gap: 8px;
            }

            .brand span {
              color: #1f5ea8;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .brand h1 {
              color: #102b4e;
              font-size: 28px;
              line-height: 1.05;
              margin: 0;
            }

            .brand p {
              color: #64748b;
              margin: 0;
            }

            .protocol-box {
              border: 1px solid #c7d4e2;
              border-radius: 16px;
              min-width: 230px;
              padding: 16px;
              text-align: right;
            }

            .protocol-box span {
              color: #64748b;
              display: block;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .protocol-box strong {
              color: #133e75;
              display: block;
              font-size: 22px;
              margin-top: 5px;
            }

            .status-pill {
              background: #e7f0fb;
              border-radius: 999px;
              color: #133e75;
              display: inline-block;
              font-weight: 800;
              margin-top: 12px;
              padding: 7px 11px;
            }

            .section-title {
              color: #102b4e;
              font-size: 16px;
              margin: 24px 0 12px;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
            }

            .field {
              background: #f7fafd;
              border: 1px solid #dbe4ee;
              border-radius: 14px;
              padding: 13px 14px;
            }

            .field.full {
              grid-column: 1 / -1;
            }

            .field span {
              color: #64748b;
              display: block;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              margin-bottom: 6px;
              text-transform: uppercase;
            }

            .field strong,
            .field p {
              color: #152238;
              display: block;
              font-size: 15px;
              line-height: 1.45;
              margin: 0;
            }

            .notice {
              background: #fff8e8;
              border: 1px solid #f2dfb5;
              border-radius: 14px;
              color: #74510d;
              line-height: 1.5;
              margin-top: 20px;
              padding: 14px 16px;
            }

            footer {
              border-top: 1px solid #dbe4ee;
              bottom: 28px;
              color: #64748b;
              display: flex;
              font-size: 12px;
              justify-content: space-between;
              left: 28px;
              padding-top: 14px;
              position: absolute;
              right: 28px;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .sheet {
                border: 0;
                box-shadow: none;
                min-height: auto;
                padding: 0;
              }

              footer {
                bottom: 0;
                left: 0;
                right: 0;
              }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <div class="topline"></div>
            <header>
              <div class="brand">
                <span>Empaer-MT</span>
                <h1>Comprovante de Agendamento</h1>
                <p>Documento emitido pelo portal de atendimento institucional.</p>
              </div>
              <aside class="protocol-box">
                <span>Protocolo</span>
                <strong>${protocolCode}</strong>
                <div class="status-pill">${status}</div>
              </aside>
            </header>

            <h2 class="section-title">Dados do atendimento</h2>
            <section class="grid">
              <div class="field">
                <span>Servico</span>
                <strong>${service}</strong>
              </div>
              <div class="field">
                <span>Data e horario</span>
                <strong>${date}</strong>
              </div>
              <div class="field">
                <span>Solicitante</span>
                <strong>${requester}</strong>
              </div>
              <div class="field">
                <span>Documento (CPF)</span>
                <strong>${document}</strong>
              </div>
              <div class="field">
                <span>Propriedade</span>
                <strong>${property}</strong>
              </div>
              <div class="field">
                <span>Extensionista</span>
                <strong>${extensionist}</strong>
              </div>
              <div class="field full">
                <span>Observacao</span>
                <p>${notes}</p>
              </div>
              <div class="field full">
                <span>Justificativa / historico</span>
                <p>${justification}</p>
              </div>
            </section>

            <div class="notice">
              Apresente este comprovante quando solicitado. A confirmacao final do atendimento depende
              da disponibilidade tecnica e das regras internas do servico.
            </div>

            <footer>
              <span>Emitido em ${issuedAt}</span>
              <span>Agendamento de Atendimento - Empaer-MT</span>
            </footer>
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleRescheduleAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const appointment = await rescheduleAppointment(rescheduleForm.protocolCode, {
        availabilityId: rescheduleForm.availabilityId,
        justification: rescheduleForm.justification,
      });

      localMessages.addMessage('success', `Protocolo ${rescheduleForm.protocolCode} reagendado.`);
      setRescheduleForm(initialRescheduleForm);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel reagendar o atendimento.'));
      console.error(error);
    }
  }

  async function handleMarkNotificationAsRead(id: string) {
    try {
      await markNotificationAsRead(id);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel marcar a notificacao como lida.'));
      console.error(error);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createUser(userForm);
      localMessages.addMessage('success', 'Usuario cadastrado.');
      setUserForm(initialUserForm);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel cadastrar o usuario.'));
      console.error(error);
    }
  }

  async function handleCreateService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createService(serviceForm);
      localMessages.addMessage('success', 'Servico cadastrado.');
      setServiceForm(initialServiceForm);
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel cadastrar o servico.'));
      console.error(error);
    }
  }

  function handleToggleUser(userId: string, isActive: boolean) {
    requestConfirmation({
      title: isActive ? 'Desativar usuario' : 'Ativar usuario',
      message: `${isActive ? 'Desativar' : 'Ativar'} este usuario?`,
      confirmLabel: isActive ? 'Desativar' : 'Ativar',
      tone: isActive ? 'danger' : 'default',
      onConfirm: async () => {
        try {
          await updateUser(userId, { isActive: !isActive });
          localMessages.addMessage('success', isActive ? 'Usuario desativado.' : 'Usuario ativado.');
          await refreshData();
        } catch (error) {
          localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel alterar o usuario.'));
          console.error(error);
        }
      },
    });
  }

  async function handleUpdateExtensionistMunicipalities(userId: string, attendanceMunicipalityIds: string[]) {
    try {
      await updateUser(userId, { attendanceMunicipalityIds });
      localMessages.addMessage('success',
        attendanceMunicipalityIds.length > 0
          ? 'Municipios de atendimento atualizados.'
          : 'Municipios de atendimento removidos.',
      );
      await refreshData();
    } catch (error) {
      localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel alterar os municipios de atendimento.'));
      console.error(error);
    }
  }

  function handleToggleService(serviceId: string, active: boolean) {
    requestConfirmation({
      title: active ? 'Desativar servico' : 'Ativar servico',
      message: `${active ? 'Desativar' : 'Ativar'} este servico do catalogo?`,
      confirmLabel: active ? 'Desativar' : 'Ativar',
      tone: active ? 'danger' : 'default',
      onConfirm: async () => {
        try {
          await updateService(serviceId, { active: !active });
          localMessages.addMessage('success', active ? 'Servico desativado.' : 'Servico ativado.');
          await refreshData();
        } catch (error) {
          localMessages.addMessage('error', getApiErrorMessage(error, 'Nao foi possivel alterar o servico.'));
          console.error(error);
        }
      },
    });
  }

  useEffect(() => {
    if (sessionChecking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sessionChecking]);

  if (sessionChecking) {
    return (
      <div className="splash-screen">
        <div className="splash-screen-card">
          <span className="form-kicker">Validando sessao</span>
          <h2>Carregando o sistema</h2>
          <p>Por favor aguarde enquanto verificamos seu acesso.</p>
          <div className="loading-state">
            <p>Validando sessão...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="login-page">
        <section className="login-intro">
          <span className="brand-badge">Portal institucional</span>
          <h1>Agendamento de Atendimento</h1>
          <p>
            Solicite, acompanhe e gerencie atendimentos tecnicos com protocolo e agenda
            em um unico ambiente oficial.
          </p>
          <div className="login-highlights" aria-label="Recursos do portal">
            <article>
              <strong>Protocolo digital</strong>
              <span>Acompanhamento com historico do atendimento.</span>
            </article>
            <article>
              <strong>Agenda tecnica</strong>
              <span>Horarios organizados por disponibilidade.</span>
            </article>
            <article>
              <strong>Perfis seguros</strong>
              <span>Acesso para solicitante, extensionista e administrador.</span>
            </article>
          </div>
        </section>

        <section className="login-box institutional-login">
          <div>
            <span className="form-kicker">{loginMode === 'login' ? 'Acesso restrito' : 'Primeiro acesso'}</span>
            <h2>{loginMode === 'login' ? 'Entrar no sistema' : 'Criar cadastro'}</h2>
            <p>
              {loginMode === 'login'
                ? 'Use seu documento e senha cadastrados.'
                : 'Cadastro simples para solicitante e propriedade rural.'}
            </p>
          </div>

          <div className="login-mode-tabs" aria-label="Alternar acesso">
            <button
              type="button"
              className={loginMode === 'login' ? 'active' : ''}
              onClick={() => {
                setLoginMode('login');
                setLoginError('');
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={loginMode === 'register' ? 'active' : ''}
              onClick={() => {
                setLoginMode('register');
                setLoginError('');
              }}
            >
              Cadastrar
            </button>
          </div>

          {loginMode === 'login' ? (
            <form className="compact-form" onSubmit={handleLogin}>
              <label>
                Documento (CPF)
                <input
                  value={formatCpf(loginDocument)}
                  inputMode="numeric"
                  onChange={(event) => setLoginDocument(event.target.value.replace(/\D/g, '').slice(0, 11))}
                />
              </label>
              <label>
                Senha
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <button type="submit" disabled={loginSubmitting || !isValidCpf(loginDocument)}>
                {loginSubmitting ? 'Entrando...' : 'Acessar'}
              </button>
            </form>
          ) : (
            <form className="compact-form" onSubmit={handleRequesterRegistration}>
              <label className={registrationErrors.document ? 'invalid' : ''}>
                CPF
                <input
                  value={formatCpf(registrationForm.document)}
                  inputMode="numeric"
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 11);
                    setRegistrationForm((current) => ({ ...current, document: value }));
                    
                    if (value.length === 11 && !isValidCpf(value)) {
                      setRegistrationErrors((current) => ({ ...current, document: 'CPF inválido' }));
                    } else if (value.length < 11) {
                      setRegistrationErrors((current) => ({ ...current, document: undefined }));
                    } else if (isValidCpf(value)) {
                      setRegistrationErrors((current) => ({ ...current, document: undefined }));
                    }
                  }}
                />
                {registrationErrors.document ? (
                  <small className="field-error">{registrationErrors.document}</small>
                ) : null}
              </label>
              <label className={registrationErrors.name ? 'invalid' : ''}>
                Nome
                <input
                  value={registrationForm.name}
                  onChange={(event) => {
                    setRegistrationForm((current) => ({ ...current, name: event.target.value }));
                    setRegistrationErrors((current) => ({ ...current, name: undefined }));
                  }}
                />
                {registrationErrors.name ? (
                  <small className="field-error">{registrationErrors.name}</small>
                ) : null}
              </label>
              <label className={registrationErrors.password ? 'invalid' : ''}>
                Senha
                <input
                  type="password"
                  value={registrationForm.password}
                  onChange={(event) => {
                    setRegistrationForm((current) => ({ ...current, password: event.target.value }));
                    setRegistrationErrors((current) => ({ ...current, password: undefined }));
                  }}
                />
                {registrationErrors.password ? (
                  <small className="field-error">{registrationErrors.password}</small>
                ) : null}
              </label>
              <label className={registrationErrors.phone ? 'invalid' : ''}>
                Telefone
                <input
                  value={registrationForm.phone}
                  inputMode="tel"
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 11);
                    setRegistrationForm((current) => ({ ...current, phone: value }));
                    setRegistrationErrors((current) => ({ ...current, phone: undefined }));
                  }}
                />
                {registrationErrors.phone ? (
                  <small className="field-error">{registrationErrors.phone}</small>
                ) : null}
              </label>
              <label className={registrationErrors.community ? 'invalid' : ''}>
                Comunidade
                <input
                  value={registrationForm.community}
                  onChange={(event) => {
                    setRegistrationForm((current) => ({ ...current, community: event.target.value }));
                    setRegistrationErrors((current) => ({ ...current, community: undefined }));
                  }}
                />
                {registrationErrors.community ? (
                  <small className="field-error">{registrationErrors.community}</small>
                ) : null}
              </label>
              <label className={registrationErrors.city ? 'invalid' : ''}>
                Municipio
                <input
                  value={registrationForm.city}
                  onChange={(event) => {
                    setRegistrationForm((current) => ({ ...current, city: event.target.value }));
                    setRegistrationErrors((current) => ({ ...current, city: undefined }));
                  }}
                />
                {registrationErrors.city ? (
                  <small className="field-error">{registrationErrors.city}</small>
                ) : null}
              </label>
              <button
                type="submit"
                disabled={
                  loginSubmitting ||
                  Object.keys(getRegistrationFormErrors(registrationForm)).length > 0
                }
              >
                {loginSubmitting ? 'Cadastrando...' : 'Criar cadastro'}
              </button>
            </form>
          )}

          <div className="login-support">
            <span>Ambiente local de homologacao</span>
            <strong>Atendimento Empaer-MT</strong>
          </div>
          {loginError || dataError ? <p className="alert error">{loginError || dataError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={isRequester ? 'simple-app requester-mode' : 'simple-app'}>
      <header className="app-header">
        <div>
          <span className="brand-badge">Empaer-MT</span>
          <h1>Agendamento de Atendimento</h1>
          <p>{currentUser.name} - {currentUser.role}</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => refreshData()}>
            Atualizar
          </button>
          <button type="button" className="secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {!isRequester ? (
        <section className="summary-grid">
          <article>
            <span>Protocolos</span>
            <strong>{visibleAppointments.length}</strong>
          </article>
          <article>
            <span>Pendentes</span>
            <strong>{openAppointments.length}</strong>
          </article>
          <article>
            <span>Aprovados</span>
            <strong>{approvedAppointments.length}</strong>
          </article>
          <article>
            <span>Agenda</span>
            <strong>{monthlyAvailabilityCount}</strong>
          </article>
        </section>
      ) : null}

      <nav className="top-menu" aria-label="Menu principal">
        {menuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeSection === item.key ? 'active' : ''}
            onClick={() => void handleMenuClick(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </nav>

      {isRequester && activeSection === 'notificacoes' ? (
        <section className="panel notification-panel">
          <div className="panel-title">
            <div>
              <span>Notificacoes</span>
              <h2>Atualizacoes do seu atendimento</h2>
            </div>
            <strong>{data.notifications.filter((notification) => !notification.readAt).length} nova(s)</strong>
          </div>

          <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

          <div className="record-list compact">
            {data.notifications.slice(0, 8).map((notification) => (
              <article
                key={notification.id}
                className={[
                  'record',
                  'notification-record',
                  getNotificationClassName(notification),
                  notification.readAt ? 'read' : 'unread',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{formatDate(notification.createdAt)}</small>
                </div>
                {!notification.readAt ? (
                  <div className="record-actions">
                    <button type="button" className="secondary" onClick={() => handleMarkNotificationAsRead(notification.id)}>
                      Marcar como lida
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
            {data.notifications.length === 0 ? <p className="empty">Nenhuma notificacao no momento.</p> : null}
          </div>
        </section>
      ) : null}

      {!['notificacoes', 'usuarios', 'servicos'].includes(activeSection) ? (
      <section className="workbench single-column">
        {isRequester && activeSection === 'novo' ? (
          <section className="panel primary-panel requester-schedule">
            <div className="panel-title">
              <div>
                <span>Agendamento</span>
                <h2>Agendar atendimento</h2>
              </div>
              <strong>{availableSlots.length} disponivel(is)</strong>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            <div className="flow-steps easy-steps" aria-label="Etapas para gerar protocolo">
              <article className={requesterStep !== 'property' && selectedProperty ? 'flow-step complete' : 'flow-step'}>
                <span>1</span>
                <div>
                  <strong>Propriedade</strong>
                  <small>{selectedProperty ? selectedProperty.displayName : 'Vincule ao protocolo'}</small>
                </div>
              </article>
              <article className={['time', 'confirm'].includes(requesterStep) && selectedService ? 'flow-step complete' : 'flow-step'}>
                <span>2</span>
                <div>
                  <strong>Atendimento</strong>
                  <small>{selectedService ? selectedService.name : 'Escolha o tipo'}</small>
                </div>
              </article>
              <article className={requesterStep === 'confirm' && selectedSlot ? 'flow-step complete' : 'flow-step'}>
                <span>3</span>
                <div>
                  <strong>Município e horário</strong>
                  <small>
                    {selectedSlot
                      ? formatDate(selectedSlot.startDateTime)
                      : selectedRequesterMunicipality
                        ? selectedRequesterMunicipality.name
                        : 'Escolha municipio e horario'}
                  </small>
                </div>
              </article>
            </div>

            <div className="easy-progress">
              <span>Passo {getRequesterStepNumber()} de 4</span>
              <strong>
                {requesterStep === 'property'
                  ? 'Escolha a propriedade vinculada'
                    : requesterStep === 'service'
                      ? 'Escolha o atendimento'
                    : requesterStep === 'time'
                    ? 'Escolha o local e horario'
                      : 'Confira e confirme'}
              </strong>
            </div>

            {requesterStep === 'property' && myProperties.length === 0 ? (
              <section className="easy-card missing-property-card">
                <div>
                  <span>Cadastro incompleto</span>
                  <h3>Nenhuma propriedade vinculada</h3>
                </div>
                <p>
                  Para solicitar um atendimento, o produtor precisa ter uma propriedade cadastrada e vinculada ao
                  perfil. Faça o cadastro inicial com os dados da propriedade antes de continuar.
                </p>
              </section>
            ) : null}
            {availableSlots.length === 0 ? (
              <p className="alert">Nenhum horario disponivel no momento.</p>
            ) : null}

            {myProperties.length > 0 ? (
            <form className="compact-form guided-form easy-form" onSubmit={handleCreateAppointment}>
              {requesterStep === 'property' ? (
                <section className="easy-card">
                  <div>
                    <span>Sua propriedade</span>
                    <h3>Selecione a propriedade vinculada</h3>
                  </div>
                  <div className="linked-property-select">
                    <label>
                      Nome da propriedade
                      <select
                        value={appointmentForm.propertyId}
                        onChange={(event) =>
                          setAppointmentForm((current) => ({ ...current, propertyId: event.target.value }))
                        }
                      >
                        {myProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="linked-property-summary">
                      <span>Municipio da propriedade</span>
                      <strong>
                        {selectedProperty ? `${selectedProperty.city}/${selectedProperty.state}` : 'Selecione a propriedade'}
                      </strong>
                    </div>
                  </div>
                  <button type="button" disabled={!appointmentForm.propertyId} onClick={() => setRequesterStep('service')}>
                    Continuar
                  </button>
                </section>
              ) : null}

              {requesterStep === 'service' ? (
                <section className="easy-card">
                  <div>
                    <span>Assunto e servico</span>
                    <h3>O que voce precisa?</h3>
                  </div>
                  <div className="service-picker">
                    <section className="service-classification-panel" aria-label="Classificacao do atendimento">
                      <span>1. Escolha o assunto</span>
                      <div className="service-classification-list compact">
                        {serviceClassifications.map((classification) => {
                          const count = activeServices.filter(
                            (service) => normalizeClassification(service.classification) === classification,
                          ).length;
                          const isActive = classification === activeServiceClassification;

                          return (
                            <button
                              key={classification}
                              type="button"
                              className={['service-classification-button', isActive ? 'active' : '']
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => {
                                setSelectedServiceClassification(classification);
                                setAppointmentForm((current) => ({ ...current, serviceId: '' }));
                              }}
                            >
                              <strong>{classification}</strong>
                              <small>{count}</small>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="service-detail-panel" aria-label="Servico do atendimento">
                      <div className="service-detail-head">
                        <span>2. Escolha o servico</span>
                        <strong>{activeServiceClassification}</strong>
                      </div>
                      <div className="service-detail-list">
                        {filteredServicesByClassification.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            className={['service-detail-option', appointmentForm.serviceId === service.id ? 'active' : '']
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => setAppointmentForm((current) => ({ ...current, serviceId: service.id }))}
                          >
                            <strong>{service.name}</strong>
                            {service.description ? <small>{service.description}</small> : null}
                          </button>
                        ))}
                        {filteredServicesByClassification.length === 0 ? (
                          <p className="empty">Nenhum servico ativo neste assunto.</p>
                        ) : null}
                      </div>
                    </section>
                  </div>
                  <div className="easy-actions">
                    <button type="button" className="secondary" onClick={() => setRequesterStep('property')}>
                      Voltar
                    </button>
                    <button type="button" disabled={!appointmentForm.serviceId} onClick={() => setRequesterStep('time')}>
                      Continuar
                    </button>
                  </div>
                </section>
              ) : null}

              {requesterStep === 'time' ? (
                <section className="easy-card">
                  <div>
                    <span>Local do atendimento</span>
                    <h3>Escolha o municipio e horario</h3>
                  </div>
                  <div className="municipality-choice-panel">
                    <span>Onde o produtor sera atendido</span>
                    <div className="appointment-location-select">
                      <select
                        value={selectedRequesterMunicipalityId}
                        onChange={(event) => {
                          setSelectedRequesterMunicipalityId(event.target.value);
                          setAppointmentForm((current) => ({ ...current, availabilityId: '', preferredDate: '' }));
                        }}
                      >
                        {requesterAvailableMunicipalities.map((municipality) => (
                          <option key={municipality.id} value={municipality.id}>
                            {municipality.name}/{municipality.state} - {municipality.total} horario(s)
                          </option>
                        ))}
                      </select>
                      <div>
                        <strong>
                          {selectedRequesterMunicipality
                            ? `${selectedRequesterMunicipality.name}/${selectedRequesterMunicipality.state}`
                            : 'Nenhum municipio disponivel'}
                        </strong>
                        <span>
                          {selectedRequesterMunicipality
                            ? `${selectedRequesterMunicipality.total} horario(s) com vaga`
                            : 'Aguarde uma agenda ser liberada'}
                        </span>
                      </div>
                    </div>
                    <div className="service-point-preview">
                      <span>Ponto de atendimento</span>
                      <strong>Endereco sera informado em breve</strong>
                    </div>
                  </div>
                  <div className="period-toggle" aria-label="Periodo do atendimento">
                    <button
                      type="button"
                      className={requesterPeriod === 'morning' ? 'active' : ''}
                      onClick={() => setRequesterPeriod('morning')}
                    >
                      Matutino
                    </button>
                    <button
                      type="button"
                      className={requesterPeriod === 'afternoon' ? 'active' : ''}
                      onClick={() => setRequesterPeriod('afternoon')}
                    >
                      Vespertino
                    </button>
                  </div>
                  <div className="choice-grid time-choice-grid">
                    {groupedRequesterPeriodSlots.slice(0, 8).map((group) => {
                      const selectedGroupSlot = group.slots.find((slot) => slot.id === appointmentForm.availabilityId);
                      const representativeSlot = selectedGroupSlot ?? group.slots[0];

                      return (
                      <button
                        key={group.key}
                        type="button"
                        className={selectedGroupSlot ? 'choice-card active' : 'choice-card'}
                        onClick={() =>
                          setAppointmentForm((current) => ({
                            ...current,
                            availabilityId: representativeSlot.id,
                            preferredDate: representativeSlot.startDateTime.slice(0, 16),
                          }))
                        }
                      >
                        <strong>{formatDate(group.startDateTime)}</strong>
                        <span>{group.slots.length} vaga(s) disponivel(is)</span>
                      </button>
                    );
                    })}
                    {groupedRequesterPeriodSlots.length === 0 ? (
                      <p className="empty">
                        {selectedRequesterMunicipalityId
                          ? 'Nenhum horario neste periodo.'
                          : 'Selecione um municipio para ver os horarios.'}
                      </p>
                    ) : null}
                  </div>
                  <div className="easy-actions">
                    <button type="button" className="secondary" onClick={() => setRequesterStep('service')}>
                      Voltar
                    </button>
                    <button type="button" disabled={!appointmentForm.availabilityId} onClick={() => setRequesterStep('confirm')}>
                      Continuar
                    </button>
                  </div>
                </section>
              ) : null}

              {requesterStep === 'confirm' ? (
                <section className="easy-card">
                  <div>
                    <span>Confirmacao</span>
                    <h3>Confira seu agendamento</h3>
                  </div>
                  <div className="selected-summary">
                    <div>
                      <span>Propriedade</span>
                      <strong>{selectedProperty?.displayName ?? 'Nao definida'}</strong>
                    </div>
                    <div>
                      <span>Atendimento</span>
                      <strong>{selectedService?.name ?? 'Nao definido'}</strong>
                    </div>
                    <div>
                      <span>Data e hora</span>
                      <strong>{selectedSlot ? formatDate(selectedSlot.startDateTime) : 'Nao definida'}</strong>
                    </div>
                    <div>
                      <span>Municipio</span>
                      <strong>
                        {selectedSlot?.municipality
                          ? `${selectedSlot.municipality.name}/${selectedSlot.municipality.state}`
                          : 'Nao definido'}
                      </strong>
                    </div>
                  </div>
                  <label>
                    Observacao, se precisar
                    <textarea
                      rows={3}
                      value={appointmentForm.notes}
                      onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Ex: preciso de orientacao sobre documentos"
                    />
                  </label>
                  <div className="easy-actions">
                    <button type="button" className="secondary" onClick={() => setRequesterStep('time')}>
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={!appointmentForm.propertyId || !appointmentForm.serviceId || !appointmentForm.availabilityId}
                    >
                      Confirmar agendamento
                    </button>
                  </div>
                </section>
              ) : null}
            </form>
            ) : null}
          </section>
        ) : null}

        {(isExtensionist || isAdmin) && activeSection === 'atendimentos' ? (
          <section className="panel primary-panel">
            <div className="panel-title">
              <div>
                <span>Atendimento tecnico</span>
                <h2>{isAdmin ? 'Gerenciar extensionistas' : 'Solicitacoes recebidas'}</h2>
              </div>
              <strong>{openAppointments.length}</strong>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            {isAdmin ? (
              <>
                <div className="admin-agenda-manager">
                  <div>
                    <span>Perfil administrado</span>
                    <strong>{selectedAgendaExtensionist?.name ?? 'Selecione um extensionista'}</strong>
                    <small>Escolha um extensionista para visualizar atendimentos, agenda e acoes.</small>
                  </div>
                  <label>
                    Extensionista
                    <select
                      value={selectedAgendaExtensionistId}
                      onChange={(event) => {
                        setSelectedAgendaExtensionistId(event.target.value);
                        setSelectedAgendaMunicipalityId('');
                      }}
                    >
                      <option value="">Selecionar extensionista</option>
                      {activeExtensionists.map((extensionist) => (
                        <option key={extensionist.id} value={extensionist.id}>
                          {extensionist.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Municipio
                    <select
                      value={selectedAgendaMunicipalityId}
                      onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                      disabled={managedAgendaMunicipalities.length === 0}
                    >
                      {managedAgendaMunicipalities.length === 0 ? (
                        <option value="">Sem municipio vinculado</option>
                      ) : null}
                      {managedAgendaMunicipalities.map((municipality) => (
                        <option key={municipality.id} value={municipality.id}>
                          {municipality.name}/{municipality.state}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedAgendaExtensionistId && managedAgendaMunicipalities.length === 0 ? (
                  <p className="alert">Vincule pelo menos um municipio ao extensionista antes de gerenciar atendimentos.</p>
                ) : null}

                {!selectedAgendaExtensionistId ? (
                  <div className="admin-extensionist-grid">
                    {activeExtensionists.map((extensionist) => {
                      const appointmentsCount = visibleAppointments.filter(
                        (appointment) =>
                          appointment.extensionistId === extensionist.id ||
                          appointment.availability?.extensionistId === extensionist.id,
                      ).length;
                      const availabilityCount = data.availability.filter(
                        (slot) => slot.extensionistId === extensionist.id && slot.startDateTime.slice(0, 7) === agendaMonth,
                      ).length;

                      return (
                        <button
                          key={extensionist.id}
                          type="button"
                          className="extensionist-card"
                          onClick={() => setSelectedAgendaExtensionistId(extensionist.id)}
                        >
                          <div>
                            <strong>{extensionist.name}</strong>
                            <span>{formatCpf(extensionist.document)}</span>
                          </div>
                          <small>{appointmentsCount} atendimento(s)</small>
                          <small>{availabilityCount} horario(s) no mes</small>
                        </button>
                      );
                    })}
                    {activeExtensionists.length === 0 ? (
                      <p className="empty">Nenhum extensionista ativo cadastrado.</p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {!isAdmin && managedAgendaMunicipalities.length > 0 ? (
              <div className="municipality-context-bar">
                <div>
                  <span>Municipio de atendimento</span>
                  <strong>{selectedAgendaMunicipality?.name ?? 'Selecione um municipio'}</strong>
                  <small>Atendimentos e acoes exibidos conforme o municipio selecionado.</small>
                </div>
                <select
                  value={selectedAgendaMunicipalityId}
                  onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                >
                  {managedAgendaMunicipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name}/{municipality.state}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!isAdmin && managedAgendaMunicipalities.length === 0 ? (
              <p className="alert">Seu perfil ainda nao possui municipio de atendimento vinculado.</p>
            ) : null}

            {hasAgendaContext ? (
            <>
            <div className="operator-board">
              <article>
                <span>Aguardando acao</span>
                <strong>{openAppointments.length}</strong>
                <small>Solicitacoes novas para aprovar</small>
              </article>
              <article>
                <span>Em atendimento</span>
                <strong>{approvedAppointments.length}</strong>
                <small>Protocolos aprovados para concluir</small>
              </article>
              <article>
                <span>Vagas futuras</span>
                <strong>{upcomingAvailability.length}</strong>
                <small>Horarios liberados em dias permitidos</small>
              </article>
            </div>

            <div className="month-calendar attendance-calendar">
              <div className="month-calendar-toolbar">
                <div>
                  <span>Calendario de atendimentos</span>
                  <strong>
                    {new Date(`${agendaMonth}-01T00:00:00`).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
                <div className="month-calendar-actions">
                  <button type="button" className="secondary" onClick={() => changeAgendaMonth(-1)}>
                    Anterior
                  </button>
                  <input
                    type="month"
                    value={agendaMonth}
                    onChange={(event) => setAgendaMonth(event.target.value)}
                  />
                  <button type="button" className="secondary" onClick={() => changeAgendaMonth(1)}>
                    Proximo
                  </button>
                </div>
              </div>

              <div className="month-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="month-grid">
                {attendanceCalendarDays.map((day) => (
                  <article
                    key={day.key}
                    className={[
                      'month-day',
                      'attendance-day',
                      day.isCurrentMonth ? '' : 'muted',
                      day.isToday ? 'today' : '',
                      day.appointments.length > 0 ? 'has-slots' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={getAttendanceDayTooltip(day.appointments)}
                  >
                    <div className="month-day-number">
                      <strong>{day.date.getDate()}</strong>
                      {day.appointments.length > 0 ? <span>{day.appointments.length}</span> : null}
                    </div>

                    <div className="attendance-events">
                      {day.appointments.slice(0, 2).map((appointment) => {
                        const showQuickActions = activeAgendaActionId === appointment.id;

                        return (
                          <article key={appointment.id} className="attendance-event">
                            <button
                              type="button"
                              className={['attendance-event-main', getStatusClassName(appointment.status)].join(' ')}
                              onClick={() => setActiveAgendaActionId((current) => (current === appointment.id ? null : appointment.id))}
                              title={`${appointment.protocolCode} - ${getStatusLabel(appointment.status)}`}
                            >
                              <span>
                                {getAppointmentDate(appointment).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <strong>{appointment.protocolCode}</strong>
                              <small>{getStatusLabel(appointment.status)}</small>
                            </button>
                            {showQuickActions ? (
                              <div className="agenda-quick-actions attendance-quick-actions">
                                {canApproveAppointmentStatus(appointment.status) ? (
                                  <button type="button" onClick={() => handleApproveAppointment(appointment)}>
                                    Aprovar
                                  </button>
                                ) : null}
                                {appointment.status === AppointmentStatus.APROVADO ? (
                                  <button type="button" onClick={() => handleFinishAppointment(appointment)}>
                                    Concluir
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="secondary"
                                  disabled={getAvailableRescheduleSlots(appointment).length === 0}
                                  onClick={() => {
                                    setActiveAgendaActionId(null);
                                    openRescheduleForm(appointment);
                                  }}
                                >
                                  Reagendar
                                </button>
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => {
                                    setActiveAgendaActionId(null);
                                    openCancelForm(appointment);
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                                  Detalhes
                                </button>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                      {day.appointments.length > 2 ? <small>+{day.appointments.length - 2} atendimento(s)</small> : null}
                    </div>
                  </article>
                ))}
              </div>
              {activeWorkAppointments.length === 0 ? <p className="empty">Nenhum atendimento pendente.</p> : null}
            </div>
            </>
            ) : null}
          </section>
        ) : null}

        <aside className="side-stack">
          {activeSection === 'protocolos' && selectedProtocol ? (
            <section
              id="protocol-detail-panel"
              className={isRequester ? 'panel protocol-detail simple-protocol-detail' : 'panel protocol-detail'}
            >
              <div className="panel-title">
                <div>
                  <span>{isRequester ? 'Detalhes do atendimento' : 'Protocolo'}</span>
                  <h2>{selectedProtocol.protocolCode}</h2>
                </div>
                <button type="button" className="secondary" onClick={() => setSelectedProtocol(null)}>
                  Fechar
                </button>
              </div>

              <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{getStatusLabel(selectedProtocol.status)}</dd>
                </div>
                {isAdmin ? (
                  <>
                    <div>
                      <dt>Solicitante</dt>
                      <dd>{selectedProtocol.requester?.name ?? 'Nao informado'}</dd>
                    </div>
                    <div>
                      <dt>Extensionista</dt>
                      <dd>
                        {selectedProtocol.extensionist?.name ??
                          selectedProtocol.availability?.extensionist?.name ??
                          'Nao definido'}
                      </dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt>Atendimento</dt>
                  <dd>{selectedProtocol.service?.name ?? 'Nao informado'}</dd>
                </div>
                <div>
                  <dt>Propriedade</dt>
                  <dd>{selectedProtocol.property?.displayName ?? 'Nao informada'}</dd>
                </div>
                <div>
                  <dt>Data e horario</dt>
                  <dd>{formatDate(selectedProtocol.scheduledStart ?? selectedProtocol.preferredDate)}</dd>
                </div>
                <div>
                  <dt>Observacao</dt>
                  <dd>{selectedProtocol.notes ?? 'Sem observacao'}</dd>
                </div>
                <div>
                  <dt>Atualizacao</dt>
                  <dd>{selectedProtocol.justification ?? 'Sem justificativa'}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                {(isExtensionist || isAdmin) && selectedProtocol.status === AppointmentStatus.APROVADO ? (
                  <button type="button" onClick={() => handleFinishAppointment(selectedProtocol)}>
                    Concluir atendimento
                  </button>
                ) : null}
                {(isExtensionist || isAdmin) && canApproveAppointmentStatus(selectedProtocol.status) ? (
                  <button type="button" onClick={() => handleApproveAppointment(selectedProtocol)}>
                    Aprovar atendimento
                  </button>
                ) : null}
                {(isExtensionist || isAdmin) ? (
                  <>
                    <button
                      type="button"
                      className="secondary"
                      disabled={getAvailableRescheduleSlots(selectedProtocol).length === 0}
                      onClick={() => openRescheduleForm(selectedProtocol)}
                    >
                      Reagendar
                    </button>
                    <button type="button" className="secondary" onClick={() => openCancelForm(selectedProtocol)}>
                      Cancelar
                    </button>
                  </>
                ) : null}
                <button type="button" className="secondary" onClick={() => handlePrintProtocol(selectedProtocol)}>
                  Imprimir comprovante
                </button>
              </div>
            </section>
          ) : null}

          {activeSection === 'protocolos' ? (
            isAdmin ? (
              <section className="panel admin-protocol-console">
                <div className="panel-title">
                  <div>
                    <span>Administracao</span>
                    <h2>Gestao de protocolos</h2>
                  </div>
                  <strong>{adminProtocolAppointments.length}</strong>
                </div>

                <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

                <div className="admin-protocol-toolbar">
                  <div>
                    <span>Consulta operacional</span>
                    <strong>
                      {selectedAgendaExtensionist?.name
                        ? `Protocolos de ${selectedAgendaExtensionist.name}`
                        : 'Todos os protocolos'}
                    </strong>
                    <small>Use a lista para abrir detalhes, aprovar, reagendar, cancelar ou imprimir.</small>
                  </div>
                  <label>
                    Extensionista
                    <select
                      value={selectedAgendaExtensionistId}
                      onChange={(event) => {
                        setSelectedAgendaExtensionistId(event.target.value);
                        setSelectedAgendaMunicipalityId('');
                      }}
                    >
                      <option value="">Todos os extensionistas</option>
                      {activeExtensionists.map((extensionist) => (
                        <option key={extensionist.id} value={extensionist.id}>
                          {extensionist.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedAgendaExtensionistId ? (
                    <label>
                      Municipio
                      <select
                        value={selectedAgendaMunicipalityId}
                        onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                        disabled={managedAgendaMunicipalities.length === 0}
                      >
                        {managedAgendaMunicipalities.length === 0 ? (
                          <option value="">Sem municipio vinculado</option>
                        ) : null}
                        {managedAgendaMunicipalities.map((municipality) => (
                          <option key={municipality.id} value={municipality.id}>
                            {municipality.name}/{municipality.state}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="admin-protocol-metrics">
                  <article>
                    <span>Aguardando</span>
                    <strong>{adminProtocolOpenCount}</strong>
                  </article>
                  <article>
                    <span>Em andamento</span>
                    <strong>{adminProtocolActiveCount}</strong>
                  </article>
                  <article>
                    <span>Concluidos</span>
                    <strong>{adminProtocolDoneCount}</strong>
                  </article>
                </div>

                <div className="admin-protocol-list">
                  {adminProtocolAppointments.slice(0, 12).map((appointment) => (
                    <article
                      key={appointment.id}
                      className={`admin-protocol-row ${getStatusClassName(appointment.status)}`}
                    >
                      <div className="admin-protocol-main">
                        <span className="status-soft">{getStatusLabel(appointment.status)}</span>
                        <strong>{appointment.protocolCode}</strong>
                        <p>{appointment.service?.name ?? 'Atendimento'}</p>
                      </div>
                      <div className="admin-protocol-info">
                        <span>Solicitante</span>
                        <strong>{appointment.requester?.name ?? 'Nao informado'}</strong>
                        <small>{appointment.property?.displayName ?? 'Propriedade nao informada'}</small>
                      </div>
                      <div className="admin-protocol-info">
                        <span>Extensionista</span>
                        <strong>
                          {appointment.extensionist?.name ??
                            appointment.availability?.extensionist?.name ??
                            'Nao definido'}
                        </strong>
                        <small>{formatDate(appointment.scheduledStart ?? appointment.preferredDate)}</small>
                      </div>
                      <div className="admin-protocol-actions">
                        <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                          Abrir
                        </button>
                        <button type="button" className="secondary" onClick={() => handlePrintProtocol(appointment)}>
                          Imprimir
                        </button>
                      </div>
                    </article>
                  ))}
                  {adminProtocolAppointments.length === 0 ? <p className="empty">Sem protocolos para exibir.</p> : null}
                </div>
              </section>
            ) : (
              <section className="panel requester-protocols">
                <div className="panel-title">
                  <div>
                    <span>Acompanhamento</span>
                    <h2>{isRequester ? 'Meus protocolos' : 'Protocolos'}</h2>
                  </div>
                  {isExtensionist ? <strong>{protocolAppointments.length}</strong> : null}
                </div>
                {isExtensionist && managedAgendaMunicipalities.length > 0 ? (
                  <div className="municipality-context-bar">
                    <div>
                      <span>Municipio de atendimento</span>
                      <strong>{selectedAgendaMunicipality?.name ?? 'Selecione um municipio'}</strong>
                      <small>Protocolos exibidos conforme o municipio selecionado.</small>
                    </div>
                    <select
                      value={selectedAgendaMunicipalityId}
                      onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                    >
                      {managedAgendaMunicipalities.map((municipality) => (
                        <option key={municipality.id} value={municipality.id}>
                          {municipality.name}/{municipality.state}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {isExtensionist && managedAgendaMunicipalities.length === 0 ? (
                  <p className="alert">Seu perfil ainda nao possui municipio de atendimento vinculado.</p>
                ) : null}
                <div className="simple-protocol-list">
                  {protocolAppointments.slice(0, isRequester ? 12 : 9).map((appointment) => (
                    <article
                      key={appointment.id}
                      className={`simple-protocol-row ${getStatusClassName(appointment.status)}`}
                    >
                      <div>
                        <span className="status-soft">{getStatusLabel(appointment.status)}</span>
                        <strong>{appointment.protocolCode}</strong>
                        <p>{appointment.service?.name ?? 'Atendimento'}</p>
                        <small>{formatDate(appointment.scheduledStart ?? appointment.preferredDate)}</small>
                      </div>
                      <div className="simple-protocol-actions">
                        <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                          Detalhes
                        </button>
                        <button type="button" className="secondary" onClick={() => handlePrintProtocol(appointment)}>
                          Imprimir
                        </button>
                      </div>
                    </article>
                  ))}
                  {protocolAppointments.length === 0 ? <p className="empty">Sem protocolos.</p> : null}
                </div>
              </section>
            )
          ) : null}

          {activeSection === 'propriedades' ? (
            isExtensionist ? (
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <span>Gestão de propriedades</span>
                    <h2>Solicitantes</h2>
                  </div>
                </div>

                <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

                <div className="form-row">
                  <label>
                    Produtor solicitante
                    <select
                      value={selectedRequesterId}
                      onChange={(event) => handleRequesterSelection(event.target.value)}
                    >
                      <option value="">Selecione um solicitante</option>
                      {requesters.map((requester) => (
                        <option key={requester.id} value={requester.id}>
                          {requester.name} - {requester.document}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {selectedRequester ? (
                  <>
                    <div className="panel-title">
                      <div>
                        <span>Propriedades do solicitante</span>
                        <h2>{selectedRequester.name}</h2>
                      </div>
                      <strong>{requesterProperties.length}</strong>
                    </div>
                    {requesterProperties.length > 0 ? (
                      <div className="simple-protocol-list">
                        {requesterProperties.map((property) => (
                          <article key={property.id} className="simple-protocol-row">
                            <div>
                              <strong>{property.displayName}</strong>
                              <p>
                                {property.city}/{property.state}
                              </p>
                              <small>{property.address ?? 'Sem endereço'}</small>
                            </div>
                            <div className="simple-protocol-actions">
                              <button type="button" className="secondary" onClick={() => handleEditProperty(property)}>
                                Editar
                              </button>
                              <button type="button" className="secondary" onClick={() => handleDeleteProperty(property.id)}>
                                Remover
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty">Nenhuma propriedade cadastrada para este solicitante.</p>
                    )}
                    <form className="compact-form" onSubmit={handleCreateProperty}>
                      <label>
                        Nome da propriedade
                        <input
                          value={propertyForm.displayName}
                          onChange={(event) => setPropertyForm((current) => ({ ...current, displayName: event.target.value }))}
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Município
                          <select
                            value={propertyForm.city}
                            onChange={(event) => {
                              const selectedMunicipio = data.serviceMunicipalities.find(
                                (municipality) => municipality.id === event.target.value,
                              );

                              setPropertyForm((current) => ({
                                ...current,
                                city: selectedMunicipio?.name ?? '',
                                state: selectedMunicipio?.state ?? current.state,
                              }));
                            }}
                          >
                            <option value="">Selecione um município</option>
                            {data.serviceMunicipalities.map((municipality) => (
                              <option key={municipality.id} value={municipality.id}>
                                {municipality.name}/{municipality.state}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          UF
                          <input
                            value={propertyForm.state}
                            onChange={(event) => setPropertyForm((current) => ({ ...current, state: event.target.value }))}
                          />
                        </label>
                      </div>
                      <label>
                        FUNRURAL
                        <input
                          value={propertyForm.funruralCode}
                          onChange={(event) => setPropertyForm((current) => ({ ...current, funruralCode: event.target.value }))}
                        />
                      </label>
                      <div className="form-actions">
                        <button type="submit" disabled={!propertyForm.displayName || !selectedRequesterId || !propertyForm.city}>
                          {editingPropertyId ? 'Salvar alterações' : 'Salvar propriedade'}
                        </button>
                        {editingPropertyId ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              setEditingPropertyId(null);
                              setPropertyForm(initialPropertyForm);
                              setSelectedPropertyMunicipalityId('');
                            }}
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </>
                ) : (
                  <p className="empty">Selecione um solicitante para visualizar e cadastrar propriedades.</p>
                )}
              </section>
            ) : null
          ) : null}

          {(isExtensionist || isAdmin) && activeSection === 'agenda' ? (
            <section className="panel">
              <div className="panel-title">
                <div>
                  <span>{isAdmin ? 'Administracao' : 'Agenda'}</span>
                  <h2>
                    {isAdmin
                      ? 'Agenda dos extensionistas'
                      : agendaView === 'next'
                        ? 'Proximos horarios'
                        : agendaView === 'release'
                          ? 'Liberar agenda'
                          : 'Agendados'}
                  </h2>
                </div>
                <strong>{agendaView === 'booked' ? bookedAgendaAppointments.length : monthlyAvailabilityCount}</strong>
              </div>

              {isAdmin ? (
                <div className="admin-agenda-control">
                  <div className="admin-agenda-selector">
                    <div>
                      <span>Perfil gerenciado</span>
                      <strong>{selectedAgendaExtensionist?.name ?? 'Selecione um extensionista'}</strong>
                      <small>A agenda sempre pertence ao extensionista selecionado.</small>
                    </div>
                    <label>
                      Extensionista
                      <select
                        value={selectedAgendaExtensionistId}
                        onChange={(event) => {
                          setSelectedAgendaExtensionistId(event.target.value);
                          setSelectedAgendaMunicipalityId('');
                        }}
                      >
                        <option value="">Selecionar extensionista</option>
                        {activeExtensionists.map((extensionist) => (
                          <option key={extensionist.id} value={extensionist.id}>
                            {extensionist.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Municipio
                      <select
                        value={selectedAgendaMunicipalityId}
                        onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                        disabled={managedAgendaMunicipalities.length === 0}
                      >
                        {managedAgendaMunicipalities.length === 0 ? (
                          <option value="">Sem municipio vinculado</option>
                        ) : null}
                        {managedAgendaMunicipalities.map((municipality) => (
                          <option key={municipality.id} value={municipality.id}>
                            {municipality.name}/{municipality.state}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {selectedAgendaExtensionistId ? (
                    <div className="admin-agenda-kpis">
                      <article>
                        <span>Mes selecionado</span>
                        <strong>{monthlyAvailabilityCount}</strong>
                        <small>horario(s)</small>
                      </article>
                      <article>
                        <span>Futuras</span>
                        <strong>{upcomingAvailability.length}</strong>
                        <small>vaga(s)</small>
                      </article>
                      <article>
                        <span>Ativos</span>
                        <strong>{bookedAgendaAppointments.length}</strong>
                        <small>atendimento(s)</small>
                      </article>
                    </div>
                  ) : (
                    <div className="admin-extensionist-grid compact-pick">
                      {activeExtensionists.map((extensionist) => (
                        <button
                          key={extensionist.id}
                          type="button"
                          className="extensionist-card"
                          onClick={() => {
                            setSelectedAgendaExtensionistId(extensionist.id);
                            setSelectedAgendaMunicipalityId('');
                          }}
                        >
                          <div>
                            <strong>{extensionist.name}</strong>
                            <span>{formatCpf(extensionist.document)}</span>
                          </div>
                          <small>Gerenciar agenda</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {isAdmin && activeExtensionists.length === 0 ? (
                <p className="alert">Cadastre um extensionista ativo antes de gerenciar a agenda.</p>
              ) : null}

              {selectedAgendaExtensionistId && managedAgendaMunicipalities.length === 0 ? (
                <p className="alert">Vincule pelo menos um municipio ao extensionista antes de liberar agenda.</p>
              ) : null}

              {!isAdmin && managedAgendaMunicipalities.length > 0 ? (
                <div className="municipality-context-bar">
                  <div>
                    <span>Municipio de atendimento</span>
                    <strong>{selectedAgendaMunicipality?.name ?? 'Selecione um municipio'}</strong>
                  </div>
                  <select
                    value={selectedAgendaMunicipalityId}
                    onChange={(event) => setSelectedAgendaMunicipalityId(event.target.value)}
                  >
                    {managedAgendaMunicipalities.map((municipality) => (
                      <option key={municipality.id} value={municipality.id}>
                        {municipality.name}/{municipality.state}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {!isAdmin && managedAgendaMunicipalities.length === 0 ? (
                <p className="alert">Seu perfil ainda nao possui municipio de atendimento vinculado.</p>
              ) : null}

              {hasAgendaContext ? (
              <>
              <div className="agenda-tabs" aria-label="Navegacao da agenda">
                <button
                  type="button"
                  className={agendaView === 'next' ? 'active' : ''}
                  onClick={() => setAgendaView('next')}
                >
                  Proximos
                </button>
                <button
                  type="button"
                  className={agendaView === 'release' ? 'active' : ''}
                  onClick={() => setAgendaView('release')}
                >
                  Liberar agenda
                </button>
                <button
                  type="button"
                  className={agendaView === 'booked' ? 'active' : ''}
                  onClick={() => setAgendaView('booked')}
                >
                  Agendados
                </button>
              </div>

              {agendaView === 'next' ? (
                <div className="month-calendar">
                  <div className="month-calendar-toolbar">
                    <div>
                      <span>Calendario mensal</span>
                      <strong>
                        {new Date(`${agendaMonth}-01T00:00:00`).toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div className="month-calendar-actions">
                      <button type="button" className="secondary" onClick={() => changeAgendaMonth(-1)}>
                        Anterior
                      </button>
                      <input
                        type="month"
                        value={agendaMonth}
                        onChange={(event) => setAgendaMonth(event.target.value)}
                      />
                      <button type="button" className="secondary" onClick={() => changeAgendaMonth(1)}>
                        Proximo
                      </button>
                    </div>
                  </div>

                  <div className="month-weekdays">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="month-grid">
                    {agendaCalendarDays.map((day) => {
                      const morningSlots = day.slots.filter((slot) => getSlotPeriod(slot) === 'morning');
                      const afternoonSlots = day.slots.filter((slot) => getSlotPeriod(slot) === 'afternoon');
                      const visiblePeriodSlots = [
                        { label: 'Manha', slots: morningSlots },
                        { label: 'Tarde', slots: afternoonSlots },
                      ].filter((period) => period.slots.length > 0);

                      return (
                        <article
                          key={day.key}
                          className={[
                            'month-day',
                            day.isCurrentMonth ? '' : 'muted',
                            day.isToday ? 'today' : '',
                            day.slots.length > 0 ? 'has-slots' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          title={getCalendarDayTooltip(day.slots)}
                        >
                          <div className="month-day-number">
                            <strong>{day.date.getDate()}</strong>
                            {day.slots.length > 0 ? <span>{day.slots.length}</span> : null}
                          </div>

                          <div className="month-day-periods">
                            {visiblePeriodSlots.map((period) => (
                              <section key={period.label} className="month-period">
                                <div className="month-period-title">
                                  <span>{period.label}</span>
                                  <strong>{period.slots.length}</strong>
                                </div>
                                <div className="month-day-events">
                                  {period.slots.slice(0, 2).map((slot) => {
                                    const activeAppointmentsForSlot = getActiveAppointmentsForSlot(slot.id);
                                    const canDelete = activeAppointmentsForSlot.length === 0;
                                    const appointment = activeAppointmentsForSlot[0];
                                    const showQuickActions = appointment && activeAgendaActionId === appointment.id;

                                    return (
                                      <div key={slot.id} className="month-event-shell">
                                        <button
                                          type="button"
                                          className={[
                                            'month-event',
                                            canDelete ? 'free' : 'busy',
                                            appointment ? getStatusClassName(appointment.status) : '',
                                          ]
                                            .filter(Boolean)
                                            .join(' ')}
                                          onClick={() => {
                                            if (canDelete) {
                                              handleDeleteAvailability(slot.id);
                                            } else if (appointment) {
                                              setActiveAgendaActionId((current) => (current === appointment.id ? null : appointment.id));
                                            }
                                          }}
                                          title={canDelete ? 'Clique para excluir este horario livre' : 'Clique para ver acoes do atendimento'}
                                        >
                                          <span>
                                            {new Date(slot.startDateTime).toLocaleTimeString('pt-BR', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                          <strong>{canDelete ? 'Livre' : appointment?.protocolCode}</strong>
                                        </button>

                                        {showQuickActions ? (
                                          <div className="agenda-quick-actions">
                                            {canApproveAppointmentStatus(appointment.status) ? (
                                              <button type="button" onClick={() => handleApproveAppointment(appointment)}>
                                                Aprovar
                                              </button>
                                            ) : null}
                                            <button
                                              type="button"
                                              className="secondary"
                                              disabled={getAvailableRescheduleSlots(appointment).length === 0}
                                              onClick={() => {
                                                setActiveAgendaActionId(null);
                                                openRescheduleForm(appointment);
                                              }}
                                            >
                                              Reagendar
                                            </button>
                                            <button
                                              type="button"
                                              className="secondary"
                                              onClick={() => {
                                                setActiveAgendaActionId(null);
                                                openCancelForm(appointment);
                                              }}
                                            >
                                              Cancelar
                                            </button>
                                            <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                                              Detalhes
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                  {period.slots.length > 2 ? <small>+{period.slots.length - 2}</small> : null}
                                </div>
                              </section>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {agendaView === 'release' ? (
                <div className="agenda-release">
                  <form className="compact-form release-form simple-release-form" onSubmit={handleCreateWeeklyAvailability}>
                    <div className="simple-release-head">
                      <strong>Liberar agenda</strong>
                      <div className="release-head-actions">
                        <span>{weeklyTimeBlocksCount} vagas</span>
                        <select
                          className="release-model-select"
                          aria-label="Modelo rapido de vagas"
                          defaultValue=""
                          onChange={(event) => {
                            const value = event.target.value;

                            if (!value) {
                              return;
                            }

                            const slots = value === 'clear' ? 0 : Number(value);

                            setWeeklyForm((current) => ({
                              ...current,
                              weekdays: [activeWeeklyWeekday],
                              dayCapacity: {
                                ...current.dayCapacity,
                                [activeWeeklyWeekday]: { morning: slots, afternoon: slots },
                              },
                            }));

                            event.target.value = '';
                          }}
                        >
                          <option value="">Modelo rapido</option>
                          <option value="1">1 por periodo</option>
                          <option value="2">2 por periodo</option>
                          <option value="clear">Limpar vagas</option>
                        </select>
                      </div>
                    </div>

                    <section className="release-section simple-release-section release-week-strip">
                      <div className="release-week-nav">
                        <button
                          type="button"
                          className="secondary"
                          disabled={!canGoToPreviousReleaseWeek}
                          onClick={() => changeReleaseWeek(-1)}
                        >
                          Anterior
                        </button>
                        <div>
                          <span>Semana</span>
                          <strong>{releaseWeekLabel}</strong>
                        </div>
                        <button type="button" className="secondary" onClick={() => changeReleaseWeek(1)}>
                          Proxima
                        </button>
                      </div>
                      <div className="release-days">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((label, index) => {
                          const dayDate = getWeekdayDate(weeklyForm.weekStartDate, index);
                          const disabled = !isAllowedAvailabilityDate(dayDate);
                          const capacity = weeklyForm.dayCapacity[index] ?? { morning: 0, afternoon: 0 };
                          const marked = !disabled && index === activeWeeklyWeekday;
                          const selected = activeWeeklyWeekday === index && marked;
                          const releasedSlotsCount = getReleasedSlotsCountForDate(dayDate);
                          const hasReachedLimit = releasedSlotsCount >= 4;
                          const total = marked ? capacity.morning + capacity.afternoon : releasedSlotsCount;

                          return (
                            <button
                              key={label}
                              type="button"
                              className={[
                                'release-day-chip',
                                marked ? 'marked' : '',
                                selected ? 'active' : '',
                                hasReachedLimit ? 'full' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              disabled={disabled}
                              title={
                                disabled
                                  ? 'Indisponivel em fim de semana ou feriado'
                                  : hasReachedLimit
                                    ? 'Ja existe horario liberado para esse Extensionista'
                                    : marked
                                    ? 'Dia selecionado para gerar agenda'
                                    : 'Clique para selecionar este dia'
                              }
                              onClick={() => {
                                setSelectedWeeklyWeekday(index);
                                setWeeklyForm((current) => ({
                                  ...current,
                                  weekdays: [index],
                                }));
                              }}
                            >
                              <strong>{label}</strong>
                              <span>{dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              <small>{total}</small>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {selectableWeeklyWeekdays.length > 0 ? (
                      <section className="release-focus-card">
                        {(() => {
                          const weekday = activeWeeklyWeekday;
                          const capacity = weeklyForm.dayCapacity[weekday] ?? { morning: 0, afternoon: 0 };
                          const times = weeklyForm.dayTimes[weekday] ?? {
                            morning: ['07:00', '09:00'],
                            afternoon: ['13:00', '15:00'],
                          };
                          const label = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][weekday];
                          const dayDate = getWeekdayDate(weeklyForm.weekStartDate, weekday);
                          const releasedSlotsCount = getReleasedSlotsCountForDate(dayDate);
                          const hasReachedLimit = releasedSlotsCount >= 4;
                          return (
                            <>
                              <div className="release-focus-head">
                                <div>
                                  <span>Dia selecionado</span>
                                  <strong>{label}, {dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong>
                                </div>
                                <div className="release-focus-actions">
                                  <small className={hasReachedLimit ? 'danger' : ''}>
                                    {hasReachedLimit ? 'Limite atingido' : `${capacity.morning + capacity.afternoon} vagas`}
                                  </small>
                                  <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => {
                                      updateWeekdayCapacity(weekday, 'morning', 0);
                                      updateWeekdayCapacity(weekday, 'afternoon', 0);
                                    }}
                                  >
                                    Limpar vagas
                                  </button>
                                </div>
                              </div>
                              {hasReachedLimit ? (
                                <p className="release-day-warning">Ja existe horario liberado para esse Extensionista</p>
                              ) : null}

                              <div className="release-period-focus-grid">
                                {(['morning', 'afternoon'] as const).map((period) => {
                                  const releasedSlots = getReleasedSlotsForDateAndPeriod(dayDate, period);
                                  const releasedTimes = new Set(releasedSlots.map((slot) => toTimeInputValue(slot.startDateTime)));
                                  const remainingPeriodSlots = Math.max(0, 2 - releasedSlots.length);
                                  const periodCapacity = Math.min(capacity[period], remainingPeriodSlots);
                                  const availableTimes = times[period].filter((startTime) => !releasedTimes.has(startTime));
                                  const periodLabel = period === 'morning' ? 'Manha' : 'Tarde';

                                  return (
                                    <section key={period} className="release-period-focus">
                                      <div className="release-period-focus-head">
                                        <strong>{periodLabel}</strong>
                                        <div className="slot-toggle compact" aria-label={`Vagas ${periodLabel.toLowerCase()}`}>
                                          {[0, 1, 2].map((value) => (
                                            <button
                                              key={value}
                                              type="button"
                                              className={periodCapacity === value ? 'active' : ''}
                                              disabled={value > remainingPeriodSlots}
                                              onClick={() => updateWeekdayCapacity(weekday, period, value)}
                                            >
                                              {value}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="release-time-row focus">
                                        {Array.from({ length: periodCapacity }, (_, index) => (
                                          <label key={`${period}-${index}`} className="release-focus-time">
                                            Horario {index + 1}
                                            <input
                                              type="time"
                                              value={availableTimes[index] ?? (period === 'morning' ? '07:00' : '13:00')}
                                              onChange={(event) => {
                                                const timeIndex = times[period].findIndex((time) => time === availableTimes[index]);
                                                updateWeekdayTime(weekday, period, timeIndex >= 0 ? timeIndex : index, event.target.value);
                                              }}
                                            />
                                          </label>
                                        ))}
                                        {periodCapacity === 0 ? (
                                          <span className="release-empty-period">Sem vagas neste periodo</span>
                                        ) : null}
                                      </div>
                                    </section>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </section>
                    ) : (
                      <p className="empty">Escolha pelo menos um dia util para liberar a agenda.</p>
                    )}

                    <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

                    <button
                      type="submit"
                      className="release-submit"
                      disabled={
                        (isAdmin && !selectedAgendaExtensionistId) ||
                        !selectedAgendaMunicipalityId ||
                        !weeklyForm.weekStartDate ||
                        selectableWeeklyWeekdays.length === 0 ||
                        weeklyTimeBlocksCount === 0 ||
                        activeDayReachedLimit
                      }
                    >
                      Gerar agenda do dia selecionado
                    </button>
                  </form>

                </div>
              ) : null}

              {agendaView === 'booked' ? (
                <div className="booked-view">
                  <div className="agenda-tabs compact-tabs" aria-label="Filtro de concluidos">
                    <button
                      type="button"
                      className={completedFilter === 'week' ? 'active' : ''}
                      onClick={() => setCompletedFilter('week')}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      className={completedFilter === 'currentMonth' ? 'active' : ''}
                      onClick={() => setCompletedFilter('currentMonth')}
                    >
                      Mes atual
                    </button>
                    <button
                      type="button"
                      className={completedFilter === 'selectedMonth' ? 'active' : ''}
                      onClick={() => setCompletedFilter('selectedMonth')}
                    >
                      Escolher mes
                    </button>
                  </div>
                  {completedFilter === 'selectedMonth' ? (
                    <label className="month-filter">
                      Mes para consultar
                      <input
                        type="month"
                        value={completedMonth}
                        onChange={(event) => setCompletedMonth(event.target.value)}
                      />
                    </label>
                  ) : null}

                  <div className="record-list compact">
                    {bookedAgendaAppointments.slice(0, 8).map((appointment) => (
                      <article key={appointment.id} className={`record schedule-record ${getStatusClassName(appointment.status)}`}>
                        <div>
                          <strong>{appointment.protocolCode}</strong>
                          <span>{appointment.service?.name ?? 'Servico'} - {appointment.property?.displayName ?? 'Propriedade'}</span>
                          <small>{getStatusLabel(appointment.status)} - {formatDate(appointment.scheduledStart ?? appointment.preferredDate)}</small>
                        </div>
                        <div className="record-actions">
                          <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                            Abrir
                          </button>
                        </div>
                      </article>
                    ))}
                    {bookedAgendaAppointments.length === 0 ? <p className="empty">Nenhum atendimento ativo na agenda.</p> : null}
                  </div>

                  <div className="record-list compact completed-list">
                    {filteredCompletedAppointments.slice(0, 8).map((appointment) => (
                      <article key={appointment.id} className={`record schedule-record ${getStatusClassName(appointment.status)}`}>
                        <div>
                          <strong>{appointment.protocolCode}</strong>
                          <span>{appointment.service?.name ?? 'Servico'} - {appointment.property?.displayName ?? 'Propriedade'}</span>
                          <small>Concluido - {formatDate(appointment.scheduledStart ?? appointment.preferredDate)}</small>
                        </div>
                        <div className="record-actions">
                          <button type="button" className="secondary" onClick={() => openProtocolDetail(appointment)}>
                            Abrir
                          </button>
                        </div>
                      </article>
                    ))}
                    {filteredCompletedAppointments.length === 0 ? <p className="empty">Nenhum concluido neste periodo.</p> : null}
                  </div>
                </div>
              ) : null}
              </>
              ) : activeExtensionists.length > 0 ? (
                <p className="empty">Selecione um extensionista para visualizar e liberar a agenda.</p>
              ) : null}
            </section>
          ) : null}

          {(isExtensionist || isAdmin) && activeSection === 'atendimentos' && rescheduleForm.protocolCode ? (
            <section className="panel" id="appointment-action-panel">
              <div className="panel-title">
                <div>
                  <span>Reagendamento</span>
                  <h2>{rescheduleForm.protocolCode}</h2>
                </div>
              </div>

              <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

              <form className="compact-form" onSubmit={handleRescheduleAppointment}>
                <label>
                  Nova data
                  <input
                    type="date"
                    min={toDateInputValue(new Date())}
                    value={rescheduleForm.date}
                    onChange={(event) => updateRescheduleDate(event.target.value)}
                  />
                </label>
                <label>
                  Periodo
                  <select
                    value={rescheduleForm.period}
                    onChange={(event) => updateReschedulePeriod(event.target.value)}
                  >
                    <option value="morning">Matutino</option>
                    <option value="afternoon">Vespertino</option>
                  </select>
                </label>
                <label>
                  Novo horario
                  <select
                    value={rescheduleForm.availabilityId}
                    onChange={(event) =>
                      setRescheduleForm((current) => ({ ...current, availabilityId: event.target.value }))
                    }
                  >
                    {getFilteredRescheduleSlots().map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.startDateTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} - {slot.capacity - getAvailabilityUsage(slot.id)} vaga(s)
                      </option>
                    ))}
                  </select>
                </label>
                {getFilteredRescheduleSlots().length === 0 ? (
                  <p className="empty">Nao ha horario livre neste periodo. Escolha outra data/periodo ou libere agenda.</p>
                ) : null}
                <label>
                  Justificativa
                  <textarea
                    rows={3}
                    value={rescheduleForm.justification}
                    onChange={(event) =>
                      setRescheduleForm((current) => ({ ...current, justification: event.target.value }))
                    }
                  />
                </label>
                <button
                  type="submit"
                  disabled={!rescheduleForm.availabilityId || !rescheduleForm.justification.trim()}
                >
                  Confirmar reagendamento
                </button>
                <button type="button" className="secondary" onClick={() => setRescheduleForm(initialRescheduleForm)}>
                  Cancelar
                </button>
              </form>
            </section>
          ) : null}

          {(isExtensionist || isAdmin) && activeSection === 'atendimentos' && cancelForm.protocolCode ? (
            <section className="panel" id="appointment-action-panel">
              <div className="panel-title">
                <div>
                  <span>Cancelamento</span>
                  <h2>{cancelForm.protocolCode}</h2>
                </div>
              </div>

              <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

              <form className="compact-form" onSubmit={handleCancelAppointment}>
                <label>
                  Justificativa
                  <textarea
                    rows={3}
                    value={cancelForm.justification}
                    onChange={(event) =>
                      setCancelForm((current) => ({ ...current, justification: event.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={!cancelForm.justification.trim()}>
                  Confirmar cancelamento
                </button>
                <button type="button" className="secondary" onClick={() => setCancelForm(initialCancelForm)}>
                  Cancelar acao
                </button>
              </form>
            </section>
          ) : null}
        </aside>
      </section>
      ) : null}

      {isAdmin && activeSection === 'usuarios' ? (
        <section className="admin-strip">
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>Administracao</span>
                <h2>Novo usuario</h2>
              </div>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            <form className="compact-form admin-form" onSubmit={handleCreateUser}>
              <input placeholder="Nome" value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} />
              <input placeholder="E-mail" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
              <input
                placeholder="Documento (CPF)"
                value={formatCpf(userForm.document)}
                inputMode="numeric"
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    document: event.target.value.replace(/\D/g, '').slice(0, 11),
                  }))
                }
              />
              <input
                type="password"
                placeholder="Senha inicial"
                value={userForm.password}
                onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
              />
              <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as UserRole }))}>
                <option value={UserRole.SOLICITANTE}>Solicitante</option>
                <option value={UserRole.EXTENSIONISTA}>Extensionista</option>
                <option value={UserRole.ADMINISTRADOR}>Administrador</option>
              </select>
              <button type="submit" disabled={!userForm.name || !userForm.email || !userForm.document || userForm.password.length < 6}>
                Cadastrar
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <span>Usuarios</span>
                <h2>Perfis e locais</h2>
              </div>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            <div className="admin-user-filter">
              <div>
                <span>Filtro de perfil</span>
                <strong>
                  {adminUserRoleFilter
                    ? `${filteredAdminUsers.length} usuario(s) encontrado(s)`
                    : 'Selecione um perfil para consultar'}
                </strong>
              </div>
              <select
                value={adminUserRoleFilter}
                onChange={(event) => {
                  setAdminUserRoleFilter(event.target.value as UserRole | '');
                  setSelectedAdminUserId('');
                }}
              >
                <option value="">Selecionar perfil</option>
                <option value={UserRole.SOLICITANTE}>Solicitante</option>
                <option value={UserRole.EXTENSIONISTA}>Extensionista</option>
                <option value={UserRole.ADMINISTRADOR}>Administrador</option>
              </select>
              {adminUserRoleFilter ? (
                <select
                  value={selectedAdminUserId}
                  onChange={(event) => setSelectedAdminUserId(event.target.value)}
                >
                  <option value="">Selecionar pessoa</option>
                  {filteredAdminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {formatCpf(user.document)}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="record-list compact">
              {!adminUserRoleFilter ? (
                <p className="empty">Selecione um perfil para exibir os usuarios.</p>
              ) : null}
              {adminUserRoleFilter && !selectedAdminUserId ? (
                <p className="empty">Selecione a pessoa para visualizar as informacoes.</p>
              ) : null}
              {selectedAdminUser ? [selectedAdminUser].map((user) => (
                <article key={user.id} className="record">
                  <div>
                    {(() => {
                      const linkedMunicipalities =
                        user.attendanceMunicipalities?.map((item) => item.municipality) ?? [];

                      return (
                        <>
                    <strong>{user.name}</strong>
                    <span>{user.role}</span>
                    <small>
                      {user.isActive ? 'Ativo' : 'Inativo'} - {formatCpf(user.document)}
                      {user.role === UserRole.EXTENSIONISTA && linkedMunicipalities.length > 0 ? (
                        <> - {linkedMunicipalities.length} municipio(s)</>
                      ) : null}
                    </small>
                    {user.role === UserRole.EXTENSIONISTA ? (
                      <div className="extensionist-location-control">
                        <div className="municipality-picker">
                          <span>Municipios de atendimento</span>
                          <div className="municipality-check-list">
                            {data.serviceMunicipalities.map((municipality) => {
                              const linkedIds = linkedMunicipalities.map((item) => item.id);
                              const isChecked = linkedIds.includes(municipality.id);

                              return (
                                <label key={municipality.id} className={isChecked ? 'active' : ''}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(event) => {
                                      const nextIds = event.target.checked
                                        ? [...linkedIds, municipality.id]
                                        : linkedIds.filter((id) => id !== municipality.id);

                                      void handleUpdateExtensionistMunicipalities(user.id, nextIds);
                                    }}
                                  />
                                  <span>{municipality.name}/MT</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="municipality-chips">
                          {linkedMunicipalities.map((municipality) => (
                            <span key={municipality.id}>{municipality.name}</span>
                          ))}
                          {linkedMunicipalities.length === 0 ? <small>Nenhum municipio vinculado.</small> : null}
                        </div>
                      </div>
                    ) : null}
                        </>
                      );
                    })()}
                  </div>
                  <div className="record-actions">
                    <button type="button" className="secondary" onClick={() => handleToggleUser(user.id, user.isActive)}>
                      {user.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </article>
              )) : null}
              {adminUserRoleFilter && filteredAdminUsers.length === 0 ? (
                <p className="empty">Nenhum usuario encontrado neste perfil.</p>
              ) : null}
              {data.serviceMunicipalities.length === 0 ? (
                <p className="empty">
                  Estrutura preparada. Cadastre municipios para vincular locais aos extensionistas.
                </p>
              ) : null}
            </div>
          </section>
        </section>
      ) : null}

      {isAdmin && activeSection === 'servicos' ? (
        <section className="admin-strip">
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>Catalogo</span>
                <h2>Novo servico</h2>
              </div>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            <form className="compact-form admin-form" onSubmit={handleCreateService}>
              <select
                value={serviceForm.classification}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, classification: event.target.value }))
                }
              >
                {serviceClassificationOrder.map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
              </select>
              <input placeholder="Nome do servico" value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} />
              <input
                type="number"
                min="15"
                step="15"
                value={serviceForm.durationMinutes}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))
                }
              />
              <input
                placeholder="Descricao"
                value={serviceForm.description}
                onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))}
              />
              <button type="submit" disabled={!serviceForm.name}>
                Cadastrar
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <span>Servicos</span>
                <h2>Catalogo completo</h2>
              </div>
              <strong>{adminFilteredServices.length}</strong>
            </div>

            <LocalMessagesContainer messages={localMessages.messages} onRemove={localMessages.removeMessage} />

            <div className="service-filter-panel">
              <label>
                Assunto
                <select
                  value={adminServiceClassificationFilter}
                  onChange={(event) => setAdminServiceClassificationFilter(event.target.value)}
                >
                  <option value="all">Todos os assuntos ({uniqueServices.length})</option>
                  {adminServiceClassificationOptions.map((classification) => {
                    const count = uniqueServices.filter(
                      (service) => normalizeClassification(service.classification) === classification,
                    ).length;

                    return (
                      <option key={classification} value={classification}>
                        {classification} ({count})
                      </option>
                    );
                  })}
                </select>
              </label>
              <div>
                <span>Resultado</span>
                <strong>{adminFilteredServices.length}</strong>
                <small>servico(s)</small>
              </div>
            </div>
            <div className="record-list compact admin-service-list">
              {adminFilteredServices.map((service) => (
                <article key={service.id} className="record">
                  <div>
                    <strong>{service.name}</strong>
                    <span>{normalizeClassification(service.classification)}</span>
                    <small>{service.durationMinutes} min - {service.active ? 'Ativo' : 'Inativo'}</small>
                  </div>
                  <div className="record-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleToggleService(service.id, service.active)}
                    >
                      {service.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </article>
              ))}
              {adminFilteredServices.length === 0 ? <p className="empty">Nenhum servico neste assunto.</p> : null}
            </div>
          </section>
        </section>
      ) : null}

      {confirmDialog ? (
        <div className="confirm-overlay" role="presentation" onClick={() => setConfirmDialog(null)}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <span>Confirmacao</span>
              <h2 id="confirm-dialog-title">{confirmDialog.title}</h2>
              <p>{confirmDialog.message}</p>
            </div>
            <div className="confirm-actions">
              <button type="button" className="secondary" onClick={() => setConfirmDialog(null)}>
                Voltar
              </button>
              <button
                type="button"
                className={confirmDialog.tone === 'danger' ? 'danger-action' : ''}
                onClick={() => void handleConfirmDialog()}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
