import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.model';
import { 
  REPAIR_ORDER_STATUS_LABELS, 
  REPAIR_ORDER_STATUS_COLORS,
  REPAIR_ORDER_PRIORITY_LABELS,
  REPAIR_ORDER_PRIORITY_COLORS,
  RepairOrderStatus,
  RepairOrderPriority
} from '../../core/models/repair-order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe],
  template: `
    <div class="dashboard-page">

      <!-- ══ HEADER ════════════════════════════════════════════════════════════ -->
      <div class="page-header">
        <div class="title-group">
          <h1>🏁 Panel de Control del Taller</h1>
          <p>Visión general en tiempo real de operaciones, recepciones, mecánicos y facturación.</p>
        </div>
        <div class="actions-group">
          <button class="btn btn-secondary" (click)="loadDashboardStats()" [disabled]="loading()">
            <span class="icon">🔄</span> Actualizar
          </button>
          <a routerLink="/customers" class="btn btn-secondary">+ Nuevo Cliente</a>
          <a routerLink="/vehicles" class="btn btn-secondary">+ Nuevo Vehículo</a>
          <a routerLink="/repair-orders" class="btn btn-primary">+ Nueva Orden</a>
        </div>
      </div>

      <!-- ══ ALERTAS DE ERROR ══════════════════════════════════════════════════ -->
      @if (errorMessage()) {
        <div class="alert alert-danger">
          <span>⚠️ {{ errorMessage() }}</span>
          <button class="alert-close" (click)="errorMessage.set('')">✕</button>
        </div>
      }

      <!-- ══ MÉTRICAS CLAVE (KPIS) ═════════════════════════════════════════════ -->
      <div class="stats-grid">
        <!-- 1. Vehículos en Taller -->
        <div class="card stat-card" routerLink="/repair-orders">
          <div class="stat-icon icon-red">🏎️</div>
          <div class="stat-content">
            <span class="stat-label">Vehículos en Taller</span>
            <span class="stat-value">{{ stats()?.vehiclesInWorkshop ?? 0 }}</span>
            <span class="stat-trend positive">En instalaciones</span>
          </div>
        </div>

        <!-- 2. Órdenes Activas -->
        <div class="card stat-card" routerLink="/repair-orders">
          <div class="stat-icon icon-blue">🔧</div>
          <div class="stat-content">
            <span class="stat-label">Órdenes Activas</span>
            <span class="stat-value">{{ stats()?.activeRepairOrders ?? 0 }}</span>
            <span class="stat-trend">
              {{ stats()?.ordersByStatus?.['IN_REPAIR'] ?? 0 }} en rep., {{ stats()?.ordersByStatus?.['DIAGNOSIS'] ?? 0 }} en diag.
            </span>
          </div>
        </div>

        <!-- 3. Citas de Hoy -->
        <div class="card stat-card" routerLink="/appointments">
          <div class="stat-icon icon-green">📅</div>
          <div class="stat-content">
            <span class="stat-label">Citas Hoy</span>
            <span class="stat-value">{{ stats()?.todayAppointments ?? 0 }}</span>
            <span class="stat-trend positive">Programadas para hoy</span>
          </div>
        </div>

        <!-- 4. Stock Bajo -->
        <div class="card stat-card" routerLink="/inventory">
          <div class="stat-icon icon-yellow">⚠️</div>
          <div class="stat-content">
            <span class="stat-label">Stock de Piezas Bajo</span>
            <span class="stat-value" [class.danger-text]="(stats()?.lowStockParts ?? 0) > 0">
              {{ stats()?.lowStockParts ?? 0 }}
            </span>
            <span class="stat-trend danger">
              {{ (stats()?.lowStockParts ?? 0) > 0 ? 'Requieren reposición' : 'Almacén óptimo' }}
            </span>
          </div>
        </div>

        <!-- 5. Facturación Aprobada -->
        <div class="card stat-card" routerLink="/budgets">
          <div class="stat-icon icon-purple">💰</div>
          <div class="stat-content">
            <span class="stat-label">Facturación Aprobada</span>
            <span class="stat-value revenue-val">
              {{ (stats()?.totalApprovedRevenue ?? 0) | number:'1.2-2' }} €
            </span>
            <span class="stat-trend positive">Presupuestos aceptados</span>
          </div>
        </div>
      </div>

      <!-- ══ CONTENIDO PRINCIPAL: TABLA & LATERAL ══════════════════════════════ -->
      <div class="content-grid">

        <!-- Columna Izquierda: Órdenes Activas Recientes -->
        <div class="card main-table-card">
          <div class="card-header">
            <div class="header-title-group">
              <h3>📋 Órdenes de Trabajo en Curso</h3>
              <span class="counter-badge">{{ stats()?.recentOrders?.length ?? 0 }} activas</span>
            </div>
            <a routerLink="/repair-orders" class="view-all">Ver todas las órdenes →</a>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Actualizando datos de taller...</p>
            </div>
          } @else if (!stats()?.recentOrders?.length) {
            <div class="empty-state">
              <span class="empty-icon">🏁</span>
              <h4>No hay órdenes de reparación activas</h4>
              <p>El taller está al día. Puedes recepcionar un nuevo vehículo abriendo una orden de trabajo.</p>
              <a routerLink="/repair-orders" class="btn btn-primary">+ Nueva Orden</a>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nº ORDEN</th>
                    <th>VEHÍCULO</th>
                    <th>CLIENTE</th>
                    <th>MECÁNICO</th>
                    <th>PRIORIDAD</th>
                    <th>ESTADO</th>
                    <th class="text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of stats()!.recentOrders; track order.id) {
                    <tr>
                      <td class="order-id">
                        <span class="order-badge">{{ order.orderNumber }}</span>
                      </td>
                      <td>
                        <div class="vehicle-cell">
                          <span class="plate-badge">{{ order.licensePlate }}</span>
                          <span class="vehicle-model">{{ order.vehicleDescription }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="customer-name">{{ order.customerName }}</span>
                      </td>
                      <td>
                        <span class="mechanic-name">
                          {{ order.mechanicName || 'Sin asignar' }}
                        </span>
                      </td>
                      <td>
                        <span class="priority-badge" [ngClass]="getPriorityColor(order.priority)">
                          {{ getPriorityLabel(order.priority) }}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" [ngClass]="getStatusColor(order.status)">
                          {{ getStatusLabel(order.status) }}
                        </span>
                      </td>
                      <td class="text-right">
                        <a routerLink="/repair-orders" class="btn-action" title="Ver orden de trabajo">
                          👁️
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Columna Derecha: Resumen de Estados & Atajos -->
        <div class="side-column">

          <!-- Desglose de Estados de Órdenes -->
          <div class="card side-panel-card">
            <div class="card-header">
              <h3>⚙️ Distribución Operativa</h3>
            </div>
            <div class="status-breakdown">
              <div class="status-row">
                <span class="status-dot dot-repair"></span>
                <span class="status-name">En Reparación Activa</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['IN_REPAIR'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-diagnosis"></span>
                <span class="status-name">En Diagnóstico Técnico</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['DIAGNOSIS'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-quote"></span>
                <span class="status-name">Presupuesto Pendiente</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['QUOTE_PENDING'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-waiting"></span>
                <span class="status-name">Esperando Recambios</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['WAITING_FOR_PARTS'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-approved"></span>
                <span class="status-name">Presupuesto Aprobado</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['APPROVED'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-received"></span>
                <span class="status-name">Recepcionado en Taller</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['RECEIVED'] ?? 0 }}</strong>
              </div>
              <div class="status-row">
                <span class="status-dot dot-completed"></span>
                <span class="status-name">Reparación Finalizada</span>
                <strong class="status-count">{{ stats()?.ordersByStatus?.['COMPLETED'] ?? 0 }}</strong>
              </div>
            </div>
          </div>

          <!-- Atajos Rápidos -->
          <div class="card side-panel-card">
            <div class="card-header">
              <h3>⚡ Acceso Rápido</h3>
            </div>
            <div class="quick-links">
              <a routerLink="/customers" class="quick-link-item">
                <span class="icon">👥</span>
                <div class="link-info">
                  <strong>Directorio de Clientes</strong>
                  <small>Buscar por DNI/CIF o teléfono</small>
                </div>
              </a>
              <a routerLink="/vehicles" class="quick-link-item">
                <span class="icon">🚗</span>
                <div class="link-info">
                  <strong>Parque de Vehículos</strong>
                  <small>Búsqueda por matrícula o VIN</small>
                </div>
              </a>
              <a routerLink="/inventory" class="quick-link-item">
                <span class="icon">📦</span>
                <div class="link-info">
                  <strong>Control de Inventario</strong>
                  <small>Almacén, stock y precios</small>
                </div>
              </a>
              <a routerLink="/budgets" class="quick-link-item">
                <span class="icon">💶</span>
                <div class="link-info">
                  <strong>Presupuestos</strong>
                  <small>Cálculo de IVA y resoluciones</small>
                </div>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      .title-group h1 {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--text-main);
        margin: 0 0 0.25rem 0;
      }

      .title-group p {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin: 0;
      }
    }

    .actions-group {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    /* ── Alerts ── */
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;

      &.alert-danger {
        background: var(--danger-bg);
        color: var(--danger);
        border: 1px solid var(--danger-border);
      }

      .alert-close {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: inherit;
      }
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;

        &.icon-red { background: rgba(220, 38, 38, 0.1); color: #dc2626; }
        &.icon-blue { background: rgba(2, 132, 199, 0.1); color: #0284c7; }
        &.icon-green { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
        &.icon-yellow { background: rgba(217, 119, 6, 0.1); color: #d97706; }
        &.icon-purple { background: rgba(147, 51, 234, 0.1); color: #9333ea; }
      }

      .stat-content {
        display: flex;
        flex-direction: column;

        .stat-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.2;

          &.danger-text { color: var(--danger); }
          &.revenue-val { color: var(--success); font-size: 1.35rem; }
        }

        .stat-trend {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 0.2rem;

          &.positive { color: var(--success); font-weight: 600; }
          &.danger { color: var(--danger); font-weight: 600; }
        }
      }
    }

    /* ── Content Grid ── */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .main-table-card {
      padding: 1.25rem;
    }

    .side-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--card-border);

      .header-title-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        .counter-badge {
          background: var(--bg-app);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
        }
      }

      .view-all {
        font-size: 0.825rem;
        font-weight: 600;
        color: var(--primary);
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }
    }

    /* ── Table ── */
    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;

      th {
        padding: 0.75rem 0.75rem;
        color: var(--text-muted);
        font-weight: 700;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--card-border);
      }

      td {
        padding: 0.75rem 0.75rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-main);
      }

      tbody tr:hover {
        background: rgba(0, 0, 0, 0.015);
      }
    }

    .order-badge {
      font-family: monospace;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.78rem;
    }

    .plate-badge {
      font-family: monospace;
      font-weight: 800;
      background: #facc15;
      color: #000;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.72rem;
      border: 1px solid #ca8a04;
      display: inline-block;
      width: fit-content;
    }

    .vehicle-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .vehicle-model {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .customer-name {
      font-weight: 600;
      font-size: 0.82rem;
    }

    .mechanic-name {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .priority-badge {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;

      &.priority-urgent { background: #fee2e2; color: #dc2626; }
      &.priority-high { background: #ffedd5; color: #ea580c; }
      &.priority-medium { background: #e0f2fe; color: #0284c7; }
      &.priority-low { background: #f1f5f9; color: #64748b; }
    }

    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;

      &.status-repair { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
      &.status-diagnosis { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
      &.status-quote { background: #fdf4ff; color: #a855f7; border: 1px solid #f5d0fe; }
      &.status-waiting { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
      &.status-approved { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
      &.status-received { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
      &.status-completed { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    }

    .btn-action {
      background: var(--bg-app);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.45rem;
      text-decoration: none;
      font-size: 0.8rem;
      cursor: pointer;
      &:hover { background: #e2e8f0; }
    }

    .text-right { text-align: right; }

    /* ── Status Breakdown (Lateral) ── */
    .status-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.82rem;
      padding: 0.35rem 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-app);

      .status-name {
        flex: 1;
        color: var(--text-main);
      }

      .status-count {
        font-family: monospace;
        font-size: 0.9rem;
        color: var(--text-main);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;

        &.dot-repair { background: #d97706; }
        &.dot-diagnosis { background: #0284c7; }
        &.dot-quote { background: #a855f7; }
        &.dot-waiting { background: #e11d48; }
        &.dot-approved { background: #059669; }
        &.dot-received { background: #94a3b8; }
        &.dot-completed { background: #16a34a; }
      }
    }

    /* ── Quick Links (Lateral) ── */
    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-link-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--card-border);
      background: #fff;
      transition: all 0.15s ease;

      &:hover {
        background: var(--bg-app);
        border-color: var(--primary-border);
        transform: translateX(2px);
      }

      .icon {
        font-size: 1.25rem;
      }

      .link-info {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 0.82rem;
          color: var(--text-main);
        }

        small {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      }
    }

    /* ── States ── */
    .loading-state, .empty-state {
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted);

      .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; display: inline-block; }
      h4 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; }
      p { font-size: 0.85rem; max-width: 420px; margin: 0 auto 1rem auto; line-height: 1.4; }
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--card-border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem auto;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.15s;

      &:disabled { opacity: 0.5; cursor: not-allowed; }

      &.btn-primary {
        background: var(--primary);
        color: #fff;
        &:hover:not(:disabled) { background: var(--primary-hover); }
      }

      &.btn-secondary {
        background: var(--bg-app);
        color: var(--text-main);
        border: 1px solid var(--card-border);
        &:hover:not(:disabled) { background: #e2e8f0; }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getStats().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al conectar con el servidor para cargar métricas del taller.');
      }
    });
  }

  getStatusLabel(status: RepairOrderStatus): string {
    return REPAIR_ORDER_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: RepairOrderStatus): string {
    return REPAIR_ORDER_STATUS_COLORS[status] || '';
  }

  getPriorityLabel(priority: RepairOrderPriority): string {
    return REPAIR_ORDER_PRIORITY_LABELS[priority] || priority;
  }

  getPriorityColor(priority: RepairOrderPriority): string {
    return REPAIR_ORDER_PRIORITY_COLORS[priority] || '';
  }
}
