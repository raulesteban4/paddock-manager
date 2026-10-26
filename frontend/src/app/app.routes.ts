import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CustomersComponent } from './features/customers/customers.component';
import { VehiclesComponent } from './features/vehicles/vehicles.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { RepairOrdersComponent } from './features/repair-orders/repair-orders.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent, 
    title: 'Iniciar Sesión | Paddock Manager',
    canActivate: [guestGuard] 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    title: 'Dashboard | Paddock Manager',
    canActivate: [authGuard] 
  },
  { 
    path: 'customers', 
    component: CustomersComponent, 
    title: 'Clientes | Paddock Manager',
    canActivate: [authGuard] 
  },
  { 
    path: 'vehicles', 
    component: VehiclesComponent, 
    title: 'Vehículos | Paddock Manager',
    canActivate: [authGuard] 
  },
  { 
    path: 'appointments', 
    component: AppointmentsComponent, 
    title: 'Citas | Paddock Manager',
    canActivate: [authGuard] 
  },
  { 
    path: 'repair-orders', 
    component: RepairOrdersComponent, 
    title: 'Órdenes de Trabajo | Paddock Manager',
    canActivate: [authGuard] 
  },
  { 
    path: 'inventory', 
    component: InventoryComponent, 
    title: 'Inventario | Paddock Manager',
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: 'dashboard' }
];