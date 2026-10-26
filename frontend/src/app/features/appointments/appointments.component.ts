import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Appointment, AppointmentRequest, AppointmentStatus, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '../../core/models/appointment.model';
import { Customer } from '../../core/models/customer.model';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="appointments-page">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div class="title-group">
          <h1>Agenda de Citas</h1>
          <p>Recepción programada de vehículos, inspecciones y asignación de franjas horarias.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+</span> Programar Cita
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
          <div class="kpi-icon total">📅</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Citas</span>
            <span class="kpi-value">{{ totalElements() }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('PROGRAMADA')" [class.active-kpi]="selectedStatus() === 'PROGRAMADA'">
          <div class="kpi-icon programada">⏳</div>
          <div class="kpi-info">
            <span class="kpi-label">Programadas</span>
            <span class="kpi-value">{{ countByStatus('PROGRAMADA') }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('CONFIRMADA')" [class.active-kpi]="selectedStatus() === 'CONFIRMADA'">
          <div class="kpi-icon confirmada">✓</div>
          <div class="kpi-info">
            <span class="kpi-label">Confirmadas</span>
            <span class="kpi-value">{{ countByStatus('CONFIRMADA') }}</span>
          </div>
        </div>

        <div class="kpi-card" (click)="filterByStatus('EN_TALLER')" [class.active-kpi]="selectedStatus() === 'EN_TALLER'">
          <div class="kpi-icon taller">🔧</div>
          <div class="kpi-info">
            <span class="kpi-label">En Taller</span>
            <span class="kpi-value">{{ countByStatus('EN_TALLER') }}</span>
          </div>
        </div>
      </div>

      <!-- Filtros por Estado -->
      <div class="card filters-card">
        <div class="status-tabs">
          <button class="tab-btn" [class.active]="selectedStatus() === 'ALL'" (click)="filterByStatus('ALL')">
            Todas ({{ appointments().length }})
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'PROGRAMADA'" (click)="filterByStatus('PROGRAMADA')">
            Programadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'CONFIRMADA'" (click)="filterByStatus('CONFIRMADA')">
            Confirmadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'EN_TALLER'" (click)="filterByStatus('EN_TALLER')">
            En Taller
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'COMPLETADA'" (click)="filterByStatus('COMPLETADA')">
            Completadas
          </button>
          <button class="tab-btn" [class.active]="selectedStatus() === 'CANCELADA'" (click)="filterByStatus('CANCELADA')">
            Canceladas
          </button>
        </div>
      </div>

      <!-- Tabla de Citas -->
      <div class="card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando citas de taller...</p>
          </div>
        } @else if (filteredAppointments().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📅</span>
            <h3>No se encontraron citas</h3>
            <p>No hay citas agendadas con el filtro seleccionado.</p>
            <button class="btn btn-primary" (click)="openCreateModal()">Programar Primera Cita</button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha & Hora</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th class="actions-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredAppointments(); track item.id) {
                  <tr>
                    <!-- Fecha y Hora -->
                    <td class="date-cell">
                      <div class="date-wrapper">
                        <span class="date-day">{{ item.appointmentDateTime | date:'dd MMM yyyy' }}</span>
                        <span class="date-time">🕒 {{ item.appointmentDateTime | date:'HH:mm' }}</span>
                      </div>
                    </td>

                    <!-- Cliente -->
                    <td class="client-cell">
                      <div class="client-name">{{ item.customerName }}</div>
                      <div class="client-phone">📞 {{ item.customerPhone }}</div>
                    </td>

                    <!-- Vehículo -->
                    <td class="vehicle-cell">
                      <div class="plate-badge">{{ item.licensePlate }}</div>
                      <div class="vehicle-desc">{{ item.vehicleDescription }}</div>
                    </td>

                    <!-- Motivo -->
                    <td class="reason-cell">
                      <div class="reason-text" [title]="item.reason">{{ item.reason }}</div>
                      @if (item.observations) {
                        <div class="obs-text" [title]="item.observations">💬 {{ item.observations }}</div>
                      }
                    </td>

                    <!-- Estado -->
                    <td>
                      <span class="badge" [ngClass]="getStatusClass(item.status)">
                        {{ getStatusLabel(item.status) }}
                      </span>
                    </td>

                    <!-- Acciones -->
                    <td class="actions-cell">
                      <div class="action-buttons">
                        <!-- Flujo de Estados -->
                        @if (item.status === 'PROGRAMADA') {
                          <button class="btn-action btn-confirm" (click)="changeStatus(item.id, 'CONFIRMADA')" title="Confirmar Cita">
                            ✓ Confirmar
                          </button>
                          <button class="btn-action btn-cancel" (click)="cancelAppointment(item.id)" title="Cancelar Cita">
                            ✕
                          </button>
                        }

                        @if (item.status === 'CONFIRMADA') {
                          <button class="btn-action btn-taller" (click)="changeStatus(item.id, 'EN_TALLER')" title="Recepción en Taller">
                            🔧 A Taller
                          </button>
                          <button class="btn-action btn-cancel" (click)="cancelAppointment(item.id)" title="Cancelar Cita">
                            ✕
                          </button>
                        }

                        @if (item.status === 'EN_TALLER') {
                          <button class="btn-action btn-complete" (click)="changeStatus(item.id, 'COMPLETADA')" title="Completar Cita">
                            🏁 Completar
                          </button>
                          <button class="btn-action btn-cancel" (click)="cancelAppointment(item.id)" title="Cancelar">
                            ✕
                          </button>
                        }

                        <!-- Editar -->
                        @if (item.status !== 'COMPLETADA' && item.status !== 'CANCELADA') {
                          <button class="btn-icon" (click)="openEditModal(item)" title="Editar Cita">
                            ✏️
                          </button>
                        }

                        <!-- Eliminar (solo si está programada o cancelada) -->
                        @if (item.status === 'PROGRAMADA' || item.status === 'CANCELADA') {
                          <button class="btn-icon delete" (click)="deleteAppointment(item.id)" title="Eliminar Definitivamente">
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
              Mostrando página {{ currentPage() + 1 }} de {{ totalPages() || 1 }} ({{ totalElements() }} registros)
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

      <!-- Modal para Crear / Editar Cita -->
      @if (isModalOpen()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ isEditing() ? 'Editar Cita' : 'Programar Nueva Cita' }}</h2>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()" class="modal-form">
              <!-- Selección de Cliente -->
              <div class="form-group">
                <label for="customerId">Cliente *</label>
                <select 
                  id="customerId" 
                  formControlName="customerId" 
                  (change)="onCustomerSelect()" 
                  [class.invalid]="isFieldInvalid('customerId')">
                  <option [ngValue]="null">-- Seleccionar Cliente --</option>
                  @for (cust of customers(); track cust.id) {
                    <option [value]="cust.id">
                      {{ cust.firstName }} {{ cust.lastName }} ({{ cust.dniCif }})
                    </option>
                  }
                </select>
                @if (isFieldInvalid('customerId')) {
                  <span class="field-error">Debes seleccionar un cliente</span>
                }
              </div>

              <!-- Selección de Vehículo (filtrado por cliente) -->
              <div class="form-group">
                <label for="vehicleId">Vehículo *</label>
                <select 
                  id="vehicleId" 
                  formControlName="vehicleId" 
                  [class.invalid]="isFieldInvalid('vehicleId')">
                  <option [ngValue]="null">
                    {{ selectedCustomerVehicles().length === 0 ? '-- Selecciona un cliente primero o sin vehículos --' : '-- Seleccionar Vehículo --' }}
                  </option>
                  @for (veh of selectedCustomerVehicles(); track veh.id) {
                    <option [value]="veh.id">
                      {{ veh.brand }} {{ veh.model }} (Matrícula: {{ veh.licensePlate }})
                    </option>
                  }
                </select>
                @if (isFieldInvalid('vehicleId')) {
                  <span class="field-error">Debes seleccionar un vehículo asignado al cliente</span>
                }
              </div>

              <!-- Fecha y Hora -->
              <div class="form-group">
                <label for="appointmentDateTime">Fecha y Hora de la Cita *</label>
                <input 
                  id="appointmentDateTime" 
                  type="datetime-local" 
                  formControlName="appointmentDateTime"
                  [class.invalid]="isFieldInvalid('appointmentDateTime')" />
                @if (isFieldInvalid('appointmentDateTime')) {
                  <span class="field-error">La fecha debe ser en el futuro</span>
                }
              </div>

              <!-- Motivo -->
              <div class="form-group">
                <label for="reason">Motivo de la Cita *</label>
                <input 
                  id="reason" 
                  type="text" 
                  formControlName="reason" 
                  placeholder="Ej: Revisión 60.000km, cambio de pastillas y aceite"
                  [class.invalid]="isFieldInvalid('reason')" />
                @if (isFieldInvalid('reason')) {
                  <span class="field-error">El motivo es obligatorio (mínimo 5 caracteres)</span>
                }
              </div>

              <!-- Observaciones -->
              <div class="form-group">
                <label for="observations">Observaciones adicionales</label>
                <textarea 
                  id="observations" 
                  rows="3" 
                  formControlName="observations" 
                  placeholder="Detalles del cliente, síntomas o peticiones específicas..."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="appointmentForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Guardar Cambios' : 'Agendar Cita') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .appointments-page {
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
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        p {
          color: var(--text-muted);
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
        &.programada { background: #fef3c7; color: #d97706; }
        &.confirmada { background: #ecfdf5; color: #059669; }
        &.taller { background: #fee2e2; color: #dc2626; }
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
      padding: 0.75rem 1rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: var(--radius-md, 12px);
    }

    .status-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      .tab-btn {
        background: transparent;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
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

    /* Date Cell */
    .date-wrapper {
      display: flex;
      flex-direction: column;

      .date-day {
        font-weight: 700;
        color: var(--text-main, #0f172a);
      }

      .date-time {
        font-size: 0.775rem;
        color: var(--text-muted, #64748b);
      }
    }

    /* Client Cell */
    .client-cell {
      .client-name {
        font-weight: 700;
        color: var(--text-main, #0f172a);
      }
      .client-phone {
        font-size: 0.775rem;
        color: var(--text-muted, #64748b);
      }
    }

    /* Vehicle Cell */
    .vehicle-cell {
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
      .vehicle-desc {
        font-size: 0.775rem;
        color: var(--text-muted, #64748b);
      }
    }

    /* Reason Cell */
    .reason-cell {
      max-width: 280px;

      .reason-text {
        font-weight: 600;
        color: var(--text-main, #0f172a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .obs-text {
        font-size: 0.775rem;
        color: var(--text-muted, #64748b);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    /* Badges de Estado */
    .badge {
      display: inline-block;
      padding: 0.3rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;

      &.status-programada { background: #fef3c7; color: #b45309; }
      &.status-confirmada { background: #ecfdf5; color: #047857; }
      &.status-en-taller  { background: #fee2e2; color: #b91c1c; }
      &.status-completada { background: #f1f5f9; color: #475569; }
      &.status-cancelada  { background: #f3f4f6; color: #9ca3af; text-decoration: line-through; }
    }

    /* Acciones */
    .actions-header { text-align: right; }
    .actions-cell { text-align: right; }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
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

      &.btn-confirm {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
        &:hover { background: #059669; color: #ffffff; }
      }

      &.btn-taller {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
        &:hover { background: #dc2626; color: #ffffff; }
      }

      &.btn-complete {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
        &:hover { background: #16a34a; color: #ffffff; }
      }

      &.btn-cancel {
        background: #f8fafc;
        color: #94a3b8;
        border: 1px solid #e2e8f0;
        padding: 0.35rem 0.5rem;
        &:hover { background: #ef4444; color: #ffffff; border-color: #ef4444; }
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

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      &.delete:hover {
        background: #fef2f2;
        border-color: #fca5a5;
      }
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

      .pagination-controls {
        display: flex;
        gap: 0.5rem;
      }

      .btn-page {
        padding: 0.4rem 0.75rem;
        border: 1px solid var(--card-border, #e2e8f0);
        background: #ffffff;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.15s;

        &:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Form */
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
      max-width: 540px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-main, #0f172a); }
      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-muted, #64748b);
        &:hover { color: var(--text-main, #0f172a); }
      }
    }

    .modal-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;

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
          transition: border-color 0.2s;

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
        &:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
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

      &.alert-danger {
        background: #fef2f2;
        border: 1px solid #fee2e2;
        color: #dc2626;
      }

      &.alert-success {
        background: #f0fdf4;
        border: 1px solid #dcfce7;
        color: #16a34a;
      }

      .close-alert {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: inherit;
      }
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly customerService = inject(CustomerService);
  private readonly vehicleService = inject(VehicleService);
  private readonly fb = inject(FormBuilder);

  // Signals
  readonly appointments = signal<Appointment[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly customerVehicles = signal<Vehicle[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly currentEditingId = signal<number | null>(null);

  readonly selectedStatus = signal<AppointmentStatus | 'ALL'>('ALL');
  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly totalElements = signal<number>(0);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Formulario reactivo
  readonly appointmentForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    vehicleId: [null, [Validators.required]],
    appointmentDateTime: ['', [Validators.required]],
    reason: ['', [Validators.required, Validators.minLength(5)]],
    observations: ['']
  });

  // Vehículos del cliente seleccionado
  readonly selectedCustomerVehicles = computed(() => {
    return this.customerVehicles();
  });

  // Filtrado de citas
  readonly filteredAppointments = computed(() => {
    const status = this.selectedStatus();
    const list = this.appointments();
    if (status === 'ALL') return list;
    return list.filter(a => a.status === status);
  });

  ngOnInit(): void {
    this.loadAppointments();
    this.loadCustomers();
  }

  loadAppointments(): void {
    this.loading.set(true);
    const status = this.selectedStatus();
    const statusParam: AppointmentStatus | undefined = status === 'ALL' ? undefined : status;

    this.appointmentService.getAppointments(statusParam, undefined, undefined, this.currentPage(), 10).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.appointments.set(res.data.content);
          this.totalPages.set(res.data.totalPages);
          this.totalElements.set(res.data.totalElements);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error cargando citas de taller');
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

  onCustomerSelect(): void {
    const customerId = this.appointmentForm.get('customerId')?.value;
    this.appointmentForm.patchValue({ vehicleId: null });

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

  filterByStatus(status: AppointmentStatus | 'ALL'): void {
    this.selectedStatus.set(status);
    this.currentPage.set(0);
    this.loadAppointments();
  }

  countByStatus(status: AppointmentStatus): number {
    return this.appointments().filter(a => a.status === status).length;
  }

  getStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] || status;
  }

  getStatusClass(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_COLORS[status] || '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.customerVehicles.set([]);
    
    // Fecha por defecto: mañana a las 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateFormatted = tomorrow.toISOString().slice(0, 16);

    this.appointmentForm.reset({
      customerId: null,
      vehicleId: null,
      appointmentDateTime: dateFormatted,
      reason: '',
      observations: ''
    });

    this.isModalOpen.set(true);
  }

  openEditModal(item: Appointment): void {
    this.isEditing.set(true);
    this.currentEditingId.set(item.id);

    // Cargar los vehículos del cliente correspondiente
    this.vehicleService.getVehicles(undefined, 0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const filtered = res.data.content.filter(v => v.customerId === Number(item.customerId));
          this.customerVehicles.set(filtered);
        }
      }
    });

    // Formatear fecha para el input datetime-local (yyyy-MM-ddTHH:mm)
    const dt = new Date(item.appointmentDateTime);
    const dateFormatted = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    this.appointmentForm.patchValue({
      customerId: item.customerId,
      vehicleId: item.vehicleId,
      appointmentDateTime: dateFormatted,
      reason: item.reason,
      observations: item.observations || ''
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.appointmentForm.reset();
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.appointmentForm.value;

    // Convertir fecha a ISO-8601 con zona
    const dateObj = new Date(formVal.appointmentDateTime);
    const isoDateTime = dateObj.toISOString();

    const request: AppointmentRequest = {
      customerId: formVal.customerId,
      vehicleId: formVal.vehicleId,
      appointmentDateTime: isoDateTime,
      reason: formVal.reason,
      observations: formVal.observations
    };

    if (this.isEditing()) {
      const id = this.currentEditingId();
      if (!id) return;
      this.appointmentService.update(id, request).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.successMessage.set('Cita actualizada correctamente');
          this.loadAppointments();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al actualizar la cita');
        }
      });
    } else {
      this.appointmentService.create(request).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.successMessage.set('Cita agendada correctamente');
          this.loadAppointments();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al crear la cita');
        }
      });
    }
  }

  changeStatus(id: number, newStatus: AppointmentStatus): void {
    this.appointmentService.changeStatus(id, newStatus).subscribe({
      next: () => {
        this.successMessage.set(`Estado de cita actualizado a ${this.getStatusLabel(newStatus)}`);
        this.loadAppointments();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error cambiando el estado');
      }
    });
  }

  cancelAppointment(id: number): void {
    if (confirm('¿Deseas cancelar esta cita?')) {
      this.appointmentService.cancel(id).subscribe({
        next: () => {
          this.successMessage.set('Cita cancelada');
          this.loadAppointments();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Error al cancelar la cita');
        }
      });
    }
  }

  deleteAppointment(id: number): void {
    if (confirm('¿Eliminar definitivamente esta cita de la base de datos?')) {
      this.appointmentService.delete(id).subscribe({
        next: () => {
          this.successMessage.set('Cita eliminada');
          this.loadAppointments();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Error al eliminar la cita');
        }
      });
    }
  }

  onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadAppointments();
  }
}
