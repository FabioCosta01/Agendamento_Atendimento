export enum UserRole {
  SOLICITANTE = 'SOLICITANTE',
  EXTENSIONISTA = 'EXTENSIONISTA',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export enum AppointmentStatus {
  SOLICITADO = 'SOLICITADO',
  APROVADO = 'APROVADO',
  REAGENDADO = 'REAGENDADO',
  CANCELADO = 'CANCELADO',
  CONCLUIDO = 'CONCLUIDO',
}

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PropertyRecord = {
  id: string;
  ownerName: string;
  ownerDocument: string;
  displayName: string;
  city: string;
  state: string;
};

export type AppointmentRecord = {
  protocolCode: string;
  serviceName: string;
  propertyName: string;
  preferredDate: string;
  status: AppointmentStatus;
};
