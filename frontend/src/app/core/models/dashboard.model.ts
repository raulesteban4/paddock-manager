import { RepairOrder } from './repair-order.model';

export interface DashboardStats {
  vehiclesInWorkshop: number;
  activeRepairOrders: number;
  todayAppointments: number;
  lowStockParts: number;
  totalApprovedRevenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: RepairOrder[];
}
