export type RepairOrderStatus = 
  | 'RECEIVED' 
  | 'DIAGNOSIS' 
  | 'QUOTE_PENDING' 
  | 'APPROVED' 
  | 'IN_REPAIR' 
  | 'WAITING_FOR_PARTS' 
  | 'COMPLETED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type RepairOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface StatusHistoryItem {
  id: number;
  previousStatus?: RepairOrderStatus;
  newStatus: RepairOrderStatus;
  changedByUserId?: number;
  changedByUserName?: string;
  notes?: string;
  changedAt: string;
}

export interface RepairOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerDni: string;
  customerPhone: string;
  vehicleId: number;
  licensePlate: string;
  vehicleDescription: string;
  mechanicId?: number;
  mechanicName?: string;
  entryDate: string;
  estimatedDeliveryDate?: string;
  mileageAtEntry: number;
  customerIssue: string;
  observations?: string;
  priority: RepairOrderPriority;
  status: RepairOrderStatus;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RepairOrderRequest {
  customerId: number | null;
  vehicleId: number | null;
  mechanicId?: number | null;
  entryDate?: string;
  estimatedDeliveryDate?: string;
  mileageAtEntry: number;
  customerIssue: string;
  observations?: string;
  priority: RepairOrderPriority;
}

export interface StatusChangeRequest {
  newStatus: RepairOrderStatus;
  notes?: string;
}

export interface MechanicSummary {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

export const REPAIR_ORDER_STATUS_LABELS: Record<RepairOrderStatus, string> = {
  RECEIVED: 'Recepcionado',
  DIAGNOSIS: 'En Diagnóstico',
  QUOTE_PENDING: 'Presupuesto Pendiente',
  APPROVED: 'Aprobado',
  IN_REPAIR: 'En Reparación',
  WAITING_FOR_PARTS: 'Esperando Piezas',
  COMPLETED: 'Completado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};

export const REPAIR_ORDER_STATUS_COLORS: Record<RepairOrderStatus, string> = {
  RECEIVED: 'status-received',
  DIAGNOSIS: 'status-diagnosis',
  QUOTE_PENDING: 'status-quote',
  APPROVED: 'status-approved',
  IN_REPAIR: 'status-repair',
  WAITING_FOR_PARTS: 'status-waiting',
  COMPLETED: 'status-completed',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled'
};

export const REPAIR_ORDER_PRIORITY_LABELS: Record<RepairOrderPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente'
};

export const REPAIR_ORDER_PRIORITY_COLORS: Record<RepairOrderPriority, string> = {
  LOW: 'priority-low',
  MEDIUM: 'priority-medium',
  HIGH: 'priority-high',
  URGENT: 'priority-urgent'
};

