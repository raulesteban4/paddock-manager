export type AppointmentStatus = 'PROGRAMADA' | 'CONFIRMADA' | 'EN_TALLER' | 'COMPLETADA' | 'CANCELADA';

export interface Appointment {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  vehicleDescription: string;
  licensePlate: string;
  appointmentDateTime: string;
  reason: string;
  observations?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  customerId: number | null;
  vehicleId: number | null;
  appointmentDateTime: string;
  reason: string;
  observations?: string;
  status?: AppointmentStatus;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_TALLER:  'En Taller',
  COMPLETADA: 'Completada',
  CANCELADA:  'Cancelada',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROGRAMADA: 'status-programada',
  CONFIRMADA: 'status-confirmada',
  EN_TALLER:  'status-en-taller',
  COMPLETADA: 'status-completada',
  CANCELADA:  'status-cancelada',
};

/** Transiciones de estado permitidas para cada estado */
export const VALID_TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_TALLER', 'CANCELADA'],
  EN_TALLER:  ['COMPLETADA', 'CANCELADA'],
};

