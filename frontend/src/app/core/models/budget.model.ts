export type BudgetStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BudgetItemType = 'LABOR' | 'PART' | 'DIAGNOSIS' | 'OTHER';

export interface BudgetItemResponse {
  id: number;
  itemType: BudgetItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BudgetItemRequest {
  itemType: BudgetItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Budget {
  id: number;
  repairOrderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  licensePlate: string;
  vehicleModel: string;
  status: BudgetStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  customerNotes?: string;
  items: BudgetItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRequest {
  repairOrderId: number;
  taxRate?: number;
  customerNotes?: string;
  items: BudgetItemRequest[];
}

export interface BudgetStatusChange {
  newStatus: BudgetStatus;
  notes?: string;
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};

export const BUDGET_STATUS_COLORS: Record<BudgetStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  APPROVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
};

export const BUDGET_ITEM_TYPE_LABELS: Record<BudgetItemType, { label: string; icon: string }> = {
  LABOR: { label: 'Mano de Obra', icon: '⏱️' },
  PART: { label: 'Recambio / Pieza', icon: '🔩' },
  DIAGNOSIS: { label: 'Diagnóstico', icon: '🔬' },
  OTHER: { label: 'Otros Conceptos', icon: '📦' }
};
