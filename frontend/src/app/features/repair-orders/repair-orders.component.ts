import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepairOrderService } from '../../core/services/repair-order.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  RepairOrder, 
  RepairOrderRequest, 
  RepairOrderStatus, 
  RepairOrderPriority, 
  MechanicSummary,
  StatusHistoryItem,
  REPAIR_ORDER_STATUS_LABELS, 
  REPAIR_ORDER_STATUS_COLORS,
  REPAIR_ORDER_PRIORITY_LABELS,
  REPAIR_ORDER_PRIORITY_COLORS
} from '../../core/models/repair-order.model';
import { Customer } from '../../core/models/customer.model';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-repair-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="orders-page">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div class="title-group">
          <h1>Órdenes de Reparación</h1>
          <p>Control operativo del taller: recepción de vehículos, diagnósticos, asignación y estados técnicos.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+</span> Nueva Orden de Trabajo
        </button>
      </div>

      <!-- Alertas de Notificación -->
      @if (errorMessage()) {
        <div class="alert alert-danger">
          <span>⚠️</span> {{ errorMessage() }}
          <button class="close-alert" (click)="errorMessage.set(null)">×</button>
        </div>
      }

      @if (successMessage()) {
        <div class="alert alert-success">
          <span>✓</span> {{ successMessage() }}
          <button class="close-alert" (click)="successMessage.set(null)">×</button>
        </div>
      }

      <!-- Resumen de Métricas (KPIs) -->
      <div class="kpi-grid">
        <div class="kpi-card" (click)="filterByStatus('ALL')" [class.active-kpi]="selectedStatus() === 'ALL'">
          <div class="kpi-icon total">📋</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Órdenes</span>
            <span class="kpi-value">{{ totalElements() }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('RECEIVED')" [class.active-kpi]="selectedStatus() === 'RECEIVED'">
          <div class="kpi-icon received">📥</div>
          <div class="kpi-info">
            <span class="kpi-label">Recepcionadas</span>
            <span class="kpi-value">{{ countByStatus('RECEIVED') }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('IN_REPAIR')" [class.active-kpi]="selectedStatus() === 'IN_REPAIR'">
          <div class="kpi-icon repair">🔧</div>
          <div class="kpi-info">
            <span class="kpi-label">En Reparación</span>
            <span class="kpi-value">{{ countByStatus('IN_REPAIR') }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('COMPLETED')" [class.active-kpi]="selectedStatus() === 'COMPLETED'">
          <div class="kpi-icon completed">🏁</div>
          <div class="kpi-info">
            <span class="kpi-label">Listas / Completadas</span>
            <span class="kpi-value">{{ countByStatus('COMPLETED') }}</span>
          </div>
        </div>
      </div>

      <!-- Barra de Búsqueda y Pestañas de Estado -->
      <div class="card filters-card">
        <div class="search-row">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="onSearch()"
              placeholder="Buscar por código de orden (ORD-), matrícula o cliente..." 
              class="search-input" />
          </div>
          <button class="btn btn-secondary" (click)="onSearch()">Buscar</button>
        </div>

        <div class="status-tabs">
          <button class="tab-btn" [class.active]="selectedStatus() === 'ALL'" (click)="filterByStatus('ALL')">
            Todas ({{ orders().length }})
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'RECEIVED'" (click)="filterByStatus('RECEIVED')">
            Recepcionadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'DIAGNOSIS'" (click)="filterByStatus('DIAGNOSIS')">
            Diagnóstico
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'QUOTE_PENDING'" (click)="filterByStatus('QUOTE_PENDING')">
            Presupuesto
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'APPROVED'" (click)="filterByStatus('APPROVED')">
            Aprobadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'IN_REPAIR'" (click)="filterByStatus('IN_REPAIR')">
            En Reparación
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'WAITING_FOR_PARTS'" (click)="filterByStatus('WAITING_FOR_PARTS')">
            Esperando Piezas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'COMPLETED'" (click)="filterByStatus('COMPLETED')">
            Completadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'DELIVERED'" (click)="filterByStatus('DELIVERED')">
            Entregadas
          </button>
        </div>
      </div>

      <!-- Tabla de Órdenes -->
      <div class="card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando órdenes de trabajo...</p>
          </div>
        } @else if (orders().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🔧</span>
            <h3>No hay órdenes de reparación</h3>
            <p>No se encontraron órdenes registradas con los filtros actuales.</p>
            <button class="btn btn-primary" (click)="openCreateModal()">Crear Primera Orden</button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Mecánico Asignado</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Entrada</th>
                  <th class="actions-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of orders(); track item.id) {
                  <tr>
                    <!-- Código de Orden -->
                    <td>
                      <span class="order-badge">{{ item.orderNumber }}</span>
                    </td>

                    <!-- Vehículo -->
                    <td>
                      <div class="plate-badge">{{ item.licensePlate }}</div>
                      <div class="sub-text">{{ item.vehicleDescription }}</div>
                    </td>

                    <!-- Cliente -->
                    <td>
                      <div class="main-text">{{ item.customerName }}</div>
                      <div class="sub-text">📞 {{ item.customerPhone }}</div>
                    </td>

                    <!-- Mecánico Asignado -->
                    <td>
                      @if (item.mechanicName) {
                        <span class="mechanic-badge">👨‍🔧 {{ item.mechanicName }}</span>
                      } @else {
                        <button class="btn-assign" (click)="openAssignModal(item)" title="Asignar Mecánico">
                          + Asignar
                        </button>
                      }
                    </td>

                    <!-- Prioridad -->
                    <td>
                      <span class="badge" [ngClass]="getPriorityClass(item.priority)">
                        {{ getPriorityLabel(item.priority) }}
                      </span>
                    </td>

                    <!-- Estado -->
                    <td>
                      <span class="badge" [ngClass]="getStatusClass(item.status)">
                        {{ getStatusLabel(item.status) }}
                      </span>
                    </td>

                    <!-- Entrada -->
                    <td>
                      <div class="main-text">{{ item.entryDate | date:'dd/MM/yyyy' }}</div>
                      <div class="sub-text">{{ item.mileageAtEntry | number }} km</div>
                    </td>

                    <!-- Acciones -->
                    <td class="actions-cell">
                      <div class="action-buttons">
                        <!-- Avanzar Estado -->
                        @if (hasTransitions(item.status)) {
                          <button class="btn-action btn-advance" (click)="openStatusModal(item)" title="Cambiar Estado">
                            ⚡ Estado
                          </button>
                        }

                        <!-- Ver Historial -->
                        <button class="btn-icon" (click)="openHistoryModal(item)" title="Ver Historial de Trazabilidad">
                          📜
                        </button>

                        <!-- Editar -->
                        @if (item.status !== 'DELIVERED' && item.status !== 'CANCELLED') {
                          <button class="btn-icon" (click)="openEditModal(item)" title="Editar Orden">
                            ✏️
                          </button>
                        }

                        <!-- Eliminar (solo en RECEIVED o CANCELLED) -->
                        @if (item.status === 'RECEIVED' || item.status === 'CANCELLED') {
                          <button class="btn-icon delete" (click)="deleteOrder(item.id)" title="Eliminar Orden">
                            🗑️
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="pagination">
            <span class="pagination-info">
              Mostrando página {{ currentPage() + 1 }} de {{ totalPages() || 1 }} ({{ totalElements() }} órdenes registradas)
            </span>
            <div class="pagination-controls">
              <button 
                class="btn-page" 
                [disabled]="currentPage() === 0" 
                (click)="onPageChange(currentPage() - 1)">
                &laquo; Anterior
              </button>
              <button 
                class="btn-page" 
                [disabled]="currentPage() >= totalPages() - 1" 
                (click)="onPageChange(currentPage() + 1)">
                Siguiente &raquo;
              </button>
            </div>
          </div>
        }
      </div>

      <!-- MODAL 1: Crear / Editar Orden -->
      @if (isModalOpen()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ isEditing() ? 'Editar Orden de Reparación' : 'Apertura de Orden de Reparación' }}</h2>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="orderForm" (ngSubmit)="onSubmit()" class="modal-form">
              <!-- Cliente -->
              <div class="form-group">
                <label for="customerId">Cliente *</label>
                <select 
                  id="customerId" 
                  formControlName="customerId" 
                  (change)="onCustomerSelect()" 
                  [class.invalid]="isFieldInvalid('customerId')">
                  <option [ngValue]="null">-- Seleccionar Cliente --</option>
                  @for (c of customers(); track c.id) {
                    <option [value]="c.id">
                      {{ c.firstName }} {{ c.lastName }} ({{ c.dniCif }})
                    </option>
                  }
                </select>
                @if (isFieldInvalid('customerId')) {
                  <span class="field-error">El cliente es obligatorio</span>
                }
              </div>

              <!-- Vehículo -->
              <div class="form-group">
                <label for="vehicleId">Vehículo *</label>
                <select 
                  id="vehicleId" 
                  formControlName="vehicleId" 
                  [class.invalid]="isFieldInvalid('vehicleId')">
                  <option [ngValue]="null">
                    {{ customerVehicles().length === 0 ? '-- Selecciona un cliente primero o sin vehículos --' : '-- Seleccionar Vehículo --' }}
                  </option>
                  @for (v of customerVehicles(); track v.id) {
                    <option [value]="v.id">
                      {{ v.brand }} {{ v.model }} (Matrícula: {{ v.licensePlate }}) - {{ v.mileage }} km
                    </option>
                  }
                </select>
                @if (isFieldInvalid('vehicleId')) {
                  <span class="field-error">El vehículo es obligatorio</span>
                }
              </div>

              <!-- Fila Kilometraje y Prioridad -->
              <div class="form-row">
                <div class="form-group half">
                  <label for="mileageAtEntry">Kilometraje al Entrar *</label>
                  <input 
                    id="mileageAtEntry" 
                    type="number" 
                    formControlName="mileageAtEntry" 
                    placeholder="Ej: 145000"
                    [class.invalid]="isFieldInvalid('mileageAtEntry')" />
                  @if (isFieldInvalid('mileageAtEntry')) {
                    <span class="field-error">Kilometraje requerido (>= 0)</span>
                  }
                </div>

                <div class="form-group half">
                  <label for="priority">Prioridad de Atención *</label>
                  <select id="priority" formControlName="priority">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <!-- Mecánico Asignado -->
              <div class="form-group">
                <label for="mechanicId">Mecánico Responsable</label>
                <select id="mechanicId" formControlName="mechanicId">
                  <option [ngValue]="null">-- Sin asignar (se asignará en diagnóstico) --</option>
                  @for (m of mechanics(); track m.id) {
                    <option [value]="m.id">👨‍🔧 {{ m.fullName }} ({{ m.email }})</option>
                  }
                </select>
              </div>

              <!-- Problema reportado -->
              <div class="form-group">
                <label for="customerIssue">Problema Reportado / Avería *</label>
                <textarea 
                  id="customerIssue" 
                  rows="3" 
                  formControlName="customerIssue" 
                  placeholder="Detalla los síntomas descritos por el cliente (ruidos, tirones, testigos encendidos...)"
                  [class.invalid]="isFieldInvalid('customerIssue')"></textarea>
                @if (isFieldInvalid('customerIssue')) {
                  <span class="field-error">El problema reportado es obligatorio (mínimo 5 caracteres)</span>
                }
              </div>

              <!-- Observaciones -->
              <div class="form-group">
                <label for="observations">Observaciones de Recepción</label>
                <textarea 
                  id="observations" 
                  rows="2" 
                  formControlName="observations" 
                  placeholder="Nivel de combustible, golpes previos en carrocería, pertenencias en habitáculo..."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="orderForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Guardar Cambios' : 'Abrir Orden de Trabajo') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 2: Cambio de Estado -->
      @if (isStatusModalOpen()) {
        <div class="modal-overlay" (click)="closeStatusModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Avanzar Estado: {{ activeOrder()?.orderNumber }}</h2>
              <button class="close-btn" (click)="closeStatusModal()">×</button>
            </div>

            <div class="modal-form">
              <div class="status-summary">
                <div class="current-badge">
                  Estado Actual: <strong>{{ getStatusLabel(activeOrder()!.status) }}</strong>
                </div>
              </div>

              <div class="form-group">
                <label for="nextStatus">Nuevo Estado *</label>
                <select id="nextStatus" [(ngModel)]="selectedNextStatus">
                  @for (st of getAvailableTransitions(activeOrder()!.status); track st) {
                    <option [value]="st">{{ getStatusLabel(st) }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="statusNotes">Notas / Motivo del cambio de estado</label>
                <textarea 
                  id="statusNotes" 
                  rows="3" 
                  [(ngModel)]="statusNotes"
                  placeholder="Ej: Se completa el desmontaje de frenos y se confirman las piezas necesarias..."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeStatusModal()">Cancelar</button>
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  [disabled]="!selectedNextStatus || isSubmitting()" 
                  (click)="confirmStatusChange()">
                  {{ isSubmitting() ? 'Actualizando...' : 'Confirmar Transición' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: Asignar Mecánico -->
      @if (isAssignModalOpen()) {
        <div class="modal-overlay" (click)="closeAssignModal()">
          <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Asignar Mecánico: {{ activeOrder()?.orderNumber }}</h2>
              <button class="close-btn" (click)="closeAssignModal()">×</button>
            </div>

            <div class="modal-form">
              <div class="form-group">
                <label for="assignSelect">Seleccionar Mecánico de Taller</label>
                <select id="assignSelect" [(ngModel)]="selectedMechanicId">
                  <option [ngValue]="null">-- Sin Asignar --</option>
                  @for (m of mechanics(); track m.id) {
                    <option [value]="m.id">👨‍🔧 {{ m.fullName }} ({{ m.email }})</option>
                  }
                </select>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeAssignModal()">Cancelar</button>
                <button type="button" class="btn btn-primary" (click)="confirmAssignMechanic()" [disabled]="isSubmitting()">
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 4: Historial de Trazabilidad -->
      @if (isHistoryModalOpen()) {
        <div class="modal-overlay" (click)="closeHistoryModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Trazabilidad de la Orden: {{ activeOrder()?.orderNumber }}</h2>
              <button class="close-btn" (click)="closeHistoryModal()">×</button>
            </div>

            <div class="modal-body history-body">
              <div class="order-summary-box">
                <div><strong>Vehículo:</strong> {{ activeOrder()?.licensePlate }} - {{ activeOrder()?.vehicleDescription }}</div>
                <div><strong>Cliente:</strong> {{ activeOrder()?.customerName }}</div>
                <div><strong>Avería:</strong> {{ activeOrder()?.customerIssue }}</div>
              </div>

              <h3>Línea de Tiempo Operativa</h3>

              @if (!activeOrder()?.statusHistory || activeOrder()!.statusHistory!.length === 0) {
                <p class="empty-text">No hay registros de historial disponibles.</p>
              } @else {
                <div class="timeline">
                  @for (h of activeOrder()!.statusHistory!; track h.id) {
                    <div class="timeline-item">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="timeline-header">
                          <span class="badge" [ngClass]="getStatusClass(h.newStatus)">
                            {{ getStatusLabel(h.newStatus) }}
                          </span>
                          <span class="timeline-date">{{ h.changedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                        </div>
                        <div class="timeline-user">Por: <strong>{{ h.changedByUserName }}</strong></div>
                        @if (h.notes) {
                          <div class="timeline-notes">💬 {{ h.notes }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-primary" (click)="closeHistoryModal()">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;

      .title-group {
        h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          margin-bottom: 0.25rem;
        }
        p {
          color: var(--text-muted, #64748b);
          font-size: 0.9rem;
        }
      }
    }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
      }

      &.active-kpi {
        border-color: var(--primary, #dc2626);
        background: #fff5f5;
      }

      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;

        &.total { background: #eff6ff; color: #2563eb; }
        &.received { background: #fef3c7; color: #d97706; }
        &.repair { background: #fee2e2; color: #dc2626; }
        &.completed { background: #ecfdf5; color: #059669; }
      }

      .kpi-info {
        display: flex;
        flex-direction: column;

        .kpi-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
        }
      }
    }

    /* Filters Card */
    .filters-card {
      padding: 1rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .search-row {
      display: flex;
      gap: 0.75rem;

      .search-box {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;

        .search-icon {
          position: absolute;
          left: 0.85rem;
          font-size: 0.95rem;
          color: var(--text-muted, #64748b);
        }

        .search-input {
          width: 100%;
          padding: 0.65rem 0.85rem 0.65rem 2.4rem;
          border: 1px solid var(--card-border, #e2e8f0);
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s;

          &:focus {
            outline: none;
            border-color: var(--primary, #dc2626);
          }
        }
      }
    }

    .status-tabs {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;

      .tab-btn {
        background: transparent;
        border: none;
        padding: 0.4rem 0.85rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-muted, #64748b);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f1f5f9;
          color: var(--text-main, #0f172a);
        }

        &.active {
          background: var(--primary, #dc2626);
          color: #ffffff;
        }
      }
    }

    /* Tabla */
    .table-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: var(--radius-md, 12px);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        background: #f8fafc;
        color: var(--text-muted, #64748b);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.85rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #e2e8f0);
      }

      td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #e2e8f0);
        font-size: 0.875rem;
        vertical-align: middle;
      }

      tbody tr:hover {
        background: #f8fafc;
      }
    }

    .order-badge {
      font-family: monospace;
      font-weight: 800;
      font-size: 0.85rem;
      color: #0f172a;
      background: #f1f5f9;
      padding: 0.25rem 0.55rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .plate-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8rem;
      border-left: 3px solid #2563eb;
      margin-bottom: 0.2rem;
    }

    .mechanic-badge {
      display: inline-block;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
    }

    .btn-assign {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #64748b;
      cursor: pointer;
      &:hover { background: #f1f5f9; color: var(--primary, #dc2626); }
    }

    .main-text { font-weight: 700; color: var(--text-main, #0f172a); }
    .sub-text { font-size: 0.775rem; color: var(--text-muted, #64748b); }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;

      &.status-received   { background: #fef3c7; color: #b45309; }
      &.status-diagnosis  { background: #e0f2fe; color: #0369a1; }
      &.status-quote      { background: #fef9c3; color: #a16207; }
      &.status-approved   { background: #ede9fe; color: #6d28d9; }
      &.status-repair     { background: #fee2e2; color: #b91c1c; }
      &.status-waiting    { background: #ffedd5; color: #c2410c; }
      &.status-completed  { background: #ecfdf5; color: #047857; }
      &.status-delivered  { background: #f1f5f9; color: #334155; }
      &.status-cancelled  { background: #f3f4f6; color: #9ca3af; text-decoration: line-through; }

      &.priority-low      { background: #f1f5f9; color: #475569; }
      &.priority-medium   { background: #e0f2fe; color: #0284c7; }
      &.priority-high     { background: #fef3c7; color: #d97706; }
      &.priority-urgent   { background: #fee2e2; color: #dc2626; font-weight: 800; }
    }

    /* Acciones */
    .actions-header { text-align: right; }
    .actions-cell { text-align: right; }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .btn-action {
      border: none;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;

      &.btn-advance {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
        &:hover { background: #dc2626; color: #ffffff; }
      }
    }

    .btn-icon {
      background: transparent;
      border: 1px solid var(--card-border, #e2e8f0);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: all 0.15s;

      &:hover { background: #f1f5f9; border-color: #cbd5e1; }
      &.delete:hover { background: #fef2f2; border-color: #fca5a5; }
    }

    /* Paginación */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--card-border, #e2e8f0);
      font-size: 0.85rem;
      color: var(--text-muted, #64748b);

      .pagination-controls { display: flex; gap: 0.5rem; }

      .btn-page {
        padding: 0.4rem 0.75rem;
        border: 1px solid var(--card-border, #e2e8f0);
        background: #ffffff;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;

        &:hover:not(:disabled) { background: #f8fafc; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    /* Estados vacíos y carga */
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      .empty-icon { font-size: 3rem; margin-bottom: 1rem; display: inline-block; }
      h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main, #0f172a); margin-bottom: 0.5rem; }
      p { color: var(--text-muted, #64748b); max-width: 400px; margin: 0 auto 1.5rem auto; font-size: 0.9rem; }
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--primary, #dc2626);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modales */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-md, 12px);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;

      &.modal-sm { max-width: 440px; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 { font-size: 1.2rem; font-weight: 700; color: var(--text-main, #0f172a); }
      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-muted, #64748b);
        &:hover { color: var(--text-main, #0f172a); }
      }
    }

    .modal-form, .history-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      overflow-y: auto;

      .form-row {
        display: flex;
        gap: 1rem;
        .half { flex: 1; }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        label {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-main, #0f172a);
        }

        input, select, textarea {
          padding: 0.65rem 0.85rem;
          border: 1px solid var(--card-border, #e2e8f0);
          border-radius: 6px;
          font-size: 0.875rem;
          font-family: inherit;

          &:focus {
            outline: none;
            border-color: var(--primary, #dc2626);
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }

          &.invalid {
            border-color: #ef4444;
            background: #fff5f5;
          }
        }

        .field-error {
          font-size: 0.75rem;
          color: #ef4444;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    /* Timeline de Trazabilidad */
    .order-summary-box {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-size: 0.825rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-left: 0.5rem;
      position: relative;
      border-left: 2px solid #e2e8f0;
      margin-left: 0.5rem;

      .timeline-item {
        position: relative;
        padding-left: 1.25rem;

        .timeline-dot {
          position: absolute;
          left: -0.45rem;
          top: 0.35rem;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary, #dc2626);
          border: 2px solid #ffffff;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .timeline-date {
          font-size: 0.75rem;
          color: #64748b;
        }

        .timeline-user {
          font-size: 0.8rem;
          color: #334155;
        }

        .timeline-notes {
          font-size: 0.825rem;
          color: #475569;
          background: #f8fafc;
          padding: 0.4rem 0.65rem;
          border-radius: 6px;
          margin-top: 0.35rem;
          border-left: 3px solid #cbd5e1;
        }
      }
    }

    /* Botones globales */
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      &.btn-primary {
        background: var(--primary, #dc2626);
        color: #ffffff;
        &:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }

      &.btn-secondary {
        background: #f1f5f9;
        color: var(--text-main, #0f172a);
        &:hover { background: #e2e8f0; }
      }
    }

    /* Alertas */
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
      font-weight: 500;

      &.alert-danger { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; }
      &.alert-success { background: #f0fdf4; border: 1px solid #dcfce7; color: #16a34a; }

      .close-alert { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: inherit; }
    }
  `]
})
export class RepairOrdersComponent implements OnInit {
  private readonly repairOrderService = inject(RepairOrderService);
  private readonly customerService = inject(CustomerService);
  private readonly vehicleService = inject(VehicleService);
  private readonly fb = inject(FormBuilder);

  // Signals
  readonly orders = signal<RepairOrder[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly customerVehicles = signal<Vehicle[]>([]);
  readonly mechanics = signal<MechanicSummary[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Modales
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly isStatusModalOpen = signal<boolean>(false);
  readonly isAssignModalOpen = signal<boolean>(false);
  readonly isHistoryModalOpen = signal<boolean>(false);

  readonly activeOrder = signal<RepairOrder | null>(null);
  selectedNextStatus: RepairOrderStatus | null = null;
  statusNotes: string = '';
  selectedMechanicId: number | null = null;

  // Filtros y Paginación
  readonly selectedStatus = signal<RepairOrderStatus | 'ALL'>('ALL');
  searchQuery: string = '';
  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly totalElements = signal<number>(0);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Formulario de Orden
  readonly orderForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    vehicleId: [null, [Validators.required]],
    mechanicId: [null],
    mileageAtEntry: [0, [Validators.required, Validators.min(0)]],
    customerIssue: ['', [Validators.required, Validators.minLength(5)]],
    observations: [''],
    priority: ['MEDIUM', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
    this.loadMechanics();
  }

  loadOrders(): void {
    this.loading.set(true);
    const currentStatus = this.selectedStatus();
    const statusParam: RepairOrderStatus | undefined = currentStatus === 'ALL' ? undefined : currentStatus;

    this.repairOrderService.getRepairOrders(
      statusParam,
      undefined,
      undefined,
      undefined,
      undefined,
      this.searchQuery,
      this.currentPage(),
      10
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders.set(res.data.content);
          this.totalPages.set(res.data.totalPages);
          this.totalElements.set(res.data.totalElements);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error cargando órdenes de reparación');
        this.loading.set(false);
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customers.set(res.data.content);
        }
      }
    });
  }

  loadMechanics(): void {
    this.repairOrderService.getMechanics().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mechanics.set(res.data);
        }
      }
    });
  }

  onCustomerSelect(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    this.orderForm.patchValue({ vehicleId: null });

    if (!customerId) {
      this.customerVehicles.set([]);
      return;
    }

    this.vehicleService.getVehicles(undefined, 0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const filtered = res.data.content.filter(v => v.customerId === Number(customerId));
          this.customerVehicles.set(filtered);
        }
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadOrders();
  }

  filterByStatus(status: RepairOrderStatus | 'ALL'): void {
    this.selectedStatus.set(status);
    this.currentPage.set(0);
    this.loadOrders();
  }

  countByStatus(status: RepairOrderStatus): number {
    return this.orders().filter(o => o.status === status).length;
  }

  getStatusLabel(status: RepairOrderStatus): string {
    return REPAIR_ORDER_STATUS_LABELS[status] || status;
  }

  getStatusClass(status: RepairOrderStatus): string {
    return REPAIR_ORDER_STATUS_COLORS[status] || '';
  }

  getPriorityLabel(priority: RepairOrderPriority): string {
    return REPAIR_ORDER_PRIORITY_LABELS[priority] || priority;
  }

  getPriorityClass(priority: RepairOrderPriority): string {
    return REPAIR_ORDER_PRIORITY_COLORS[priority] || '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasTransitions(status: RepairOrderStatus): boolean {
    return this.getAvailableTransitions(status).length > 0;
  }

  getAvailableTransitions(status: RepairOrderStatus): RepairOrderStatus[] {
    switch (status) {
      case 'RECEIVED':
        return ['DIAGNOSIS', 'CANCELLED'];
      case 'DIAGNOSIS':
        return ['QUOTE_PENDING', 'IN_REPAIR', 'CANCELLED'];
      case 'QUOTE_PENDING':
        return ['APPROVED', 'CANCELLED'];
      case 'APPROVED':
        return ['IN_REPAIR', 'WAITING_FOR_PARTS', 'CANCELLED'];
      case 'IN_REPAIR':
        return ['WAITING_FOR_PARTS', 'COMPLETED', 'CANCELLED'];
      case 'WAITING_FOR_PARTS':
        return ['IN_REPAIR', 'CANCELLED'];
      case 'COMPLETED':
        return ['DELIVERED'];
      default:
        return [];
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.activeOrder.set(null);
    this.customerVehicles.set([]);

    this.orderForm.reset({
      customerId: null,
      vehicleId: null,
      mechanicId: null,
      mileageAtEntry: 0,
      customerIssue: '',
      observations: '',
      priority: 'MEDIUM'
    });

    this.isModalOpen.set(true);
  }

  openEditModal(item: RepairOrder): void {
    this.isEditing.set(true);
    this.activeOrder.set(item);

    this.vehicleService.getVehicles(undefined, 0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const filtered = res.data.content.filter(v => v.customerId === Number(item.customerId));
          this.customerVehicles.set(filtered);
        }
      }
    });

    this.orderForm.patchValue({
      customerId: item.customerId,
      vehicleId: item.vehicleId,
      mechanicId: item.mechanicId || null,
      mileageAtEntry: item.mileageAtEntry,
      customerIssue: item.customerIssue,
      observations: item.observations || '',
      priority: item.priority
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.orderForm.reset();
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.orderForm.value;

    const request: RepairOrderRequest = {
      customerId: formVal.customerId,
      vehicleId: formVal.vehicleId,
      mechanicId: formVal.mechanicId || null,
      mileageAtEntry: formVal.mileageAtEntry,
      customerIssue: formVal.customerIssue,
      observations: formVal.observations,
      priority: formVal.priority
    };

    if (this.isEditing()) {
      const id = this.activeOrder()?.id;
      if (!id) return;

      this.repairOrderService.update(id, request).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.successMessage.set('Orden de reparación actualizada correctamente');
          this.loadOrders();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al actualizar la orden');
        }
      });
    } else {
      this.repairOrderService.create(request).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.successMessage.set(`Orden ${res.data?.orderNumber} registrada con éxito`);
          this.loadOrders();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al crear la orden');
        }
      });
    }
  }

  openStatusModal(order: RepairOrder): void {
    this.activeOrder.set(order);
    const transitions = this.getAvailableTransitions(order.status);
    this.selectedNextStatus = transitions.length > 0 ? transitions[0] : null;
    this.statusNotes = '';
    this.isStatusModalOpen.set(true);
  }

  closeStatusModal(): void {
    this.isStatusModalOpen.set(false);
    this.selectedNextStatus = null;
    this.statusNotes = '';
  }

  confirmStatusChange(): void {
    const order = this.activeOrder();
    if (!order || !this.selectedNextStatus) return;

    this.isSubmitting.set(true);
    this.repairOrderService.changeStatus(order.id, {
      newStatus: this.selectedNextStatus,
      notes: this.statusNotes
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeStatusModal();
        this.successMessage.set(`Estado de orden ${order.orderNumber} actualizado a ${this.getStatusLabel(this.selectedNextStatus!)}`);
        this.loadOrders();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al cambiar estado');
      }
    });
  }

  openAssignModal(order: RepairOrder): void {
    this.activeOrder.set(order);
    this.selectedMechanicId = order.mechanicId || null;
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.selectedMechanicId = null;
  }

  confirmAssignMechanic(): void {
    const order = this.activeOrder();
    if (!order) return;

    this.isSubmitting.set(true);
    this.repairOrderService.assignMechanic(order.id, this.selectedMechanicId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeAssignModal();
        this.successMessage.set(`Mecánico asignado a la orden ${order.orderNumber}`);
        this.loadOrders();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Error asignando mecánico');
      }
    });
  }

  openHistoryModal(order: RepairOrder): void {
    this.activeOrder.set(order);
    this.isHistoryModalOpen.set(true);
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
  }

  deleteOrder(id: number): void {
    if (confirm('¿Eliminar definitivamente esta orden de reparación?')) {
      this.repairOrderService.delete(id).subscribe({
        next: () => {
          this.successMessage.set('Orden eliminada correctamente');
          this.loadOrders();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Error eliminando la orden');
        }
      });
    }
  }

  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadOrders();
  }
}
