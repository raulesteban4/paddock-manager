import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BudgetService } from '../../core/services/budget.service';
import { RepairOrderService } from '../../core/services/repair-order.service';
import { 
  Budget, 
  BudgetRequest, 
  BudgetStatus, 
  BudgetItemType, 
  BudgetItemResponse,
  BUDGET_STATUS_LABELS, 
  BUDGET_STATUS_COLORS,
  BUDGET_ITEM_TYPE_LABELS 
} from '../../core/models/budget.model';
import { RepairOrder } from '../../core/models/repair-order.model';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="budgets-container">

      <!-- ══ HEADER ════════════════════════════════════════════════════════════ -->
      <div class="page-header">
        <div class="header-info">
          <h1 class="page-title">💶 Presupuestos de Reparación</h1>
          <p class="page-subtitle">Cálculo de partidas, control de IVA (21%) y gestión de aprobaciones</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span class="btn-icon">＋</span> Nuevo Presupuesto
          </button>
        </div>
      </div>

      <!-- ══ KPIS ══════════════════════════════════════════════════════════════ -->
      <div class="kpi-grid">
        <div class="kpi-card" (click)="filterByStatus('ALL')" [class.active-kpi]="selectedStatus() === 'ALL'">
          <div class="kpi-icon">📊</div>
          <div class="kpi-content">
            <span class="kpi-label">Total Presupuestos</span>
            <span class="kpi-value">{{ totalElements() }}</span>
          </div>
        </div>

        <div class="kpi-card pending" (click)="filterByStatus('PENDING')" [class.active-kpi]="selectedStatus() === 'PENDING'">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-content">
            <span class="kpi-label">Pendientes</span>
            <span class="kpi-value">{{ countPending() }}</span>
          </div>
        </div>

        <div class="kpi-card approved" (click)="filterByStatus('APPROVED')" [class.active-kpi]="selectedStatus() === 'APPROVED'">
          <div class="kpi-icon">✅</div>
          <div class="kpi-content">
            <span class="kpi-label">Aprobados</span>
            <span class="kpi-value">{{ countApproved() }}</span>
          </div>
        </div>

        <div class="kpi-card revenue">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Importe Aprobado</span>
            <span class="kpi-value">{{ totalApprovedRevenue() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- ══ TOOLBAR & FILTROS ═════════════════════════════════════════════════ -->
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Buscar por nº orden, matrícula o cliente..." 
            class="search-input"
          />
          @if (searchQuery) {
            <button class="clear-search" (click)="clearSearch()">✕</button>
          }
        </div>

        <div class="status-tabs">
          <button class="tab-btn" [class.active]="selectedStatus() === 'ALL'" (click)="filterByStatus('ALL')">Todos</button>
          <button class="tab-btn pending" [class.active]="selectedStatus() === 'PENDING'" (click)="filterByStatus('PENDING')">Pendientes</button>
          <button class="tab-btn approved" [class.active]="selectedStatus() === 'APPROVED'" (click)="filterByStatus('APPROVED')">Aprobados</button>
          <button class="tab-btn rejected" [class.active]="selectedStatus() === 'REJECTED'" (click)="filterByStatus('REJECTED')">Rechazados</button>
        </div>
      </div>

      <!-- ══ MENSAJES DE ALERTA ════════════════════════════════════════════════ -->
      @if (errorMessage()) {
        <div class="alert alert-error">
          <span>⚠️ {{ errorMessage() }}</span>
          <button class="alert-close" (click)="errorMessage.set('')">✕</button>
        </div>
      }
      @if (successMessage()) {
        <div class="alert alert-success">
          <span>✅ {{ successMessage() }}</span>
          <button class="alert-close" (click)="successMessage.set('')">✕</button>
        </div>
      }

      <!-- ══ TABLA DE PRESUPUESTOS ═════════════════════════════════════════════ -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando presupuestos...</p>
          </div>
        } @else if (budgets().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">💶</div>
            <h3>No se encontraron presupuestos</h3>
            <p>Genera un presupuesto a partir de una orden de reparación activa.</p>
            <button class="btn btn-primary" (click)="openCreateModal()">+ Emitir Presupuesto</button>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Nº ORDEN</th>
                <th>VEHÍCULO</th>
                <th>CLIENTE</th>
                <th>PARTIDAS</th>
                <th>SUBTOTAL</th>
                <th>IVA (21%)</th>
                <th>TOTAL</th>
                <th>ESTADO</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (b of budgets(); track b.id) {
                <tr>
                  <td>
                    <span class="order-badge">📋 {{ b.orderNumber }}</span>
                  </td>
                  <td>
                    <div class="vehicle-cell">
                      <span class="plate-badge">{{ b.licensePlate }}</span>
                      <span class="vehicle-model">{{ b.vehicleModel }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="customer-cell">
                      <span class="customer-name">{{ b.customerName }}</span>
                      <span class="customer-phone">{{ b.customerPhone || 'Sin tel.' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="items-badge">{{ b.items.length }} conceptos</span>
                  </td>
                  <td class="font-mono">{{ b.subtotal | number:'1.2-2' }} €</td>
                  <td class="font-mono text-muted">{{ b.taxAmount | number:'1.2-2' }} €</td>
                  <td class="font-mono font-bold total-cell">{{ b.total | number:'1.2-2' }} €</td>
                  <td>
                    <span 
                      class="status-pill"
                      [style.background]="getStatusColors(b.status).bg"
                      [style.color]="getStatusColors(b.status).text"
                      [style.border-color]="getStatusColors(b.status).border"
                    >
                      {{ getStatusLabel(b.status) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="btn-icon-action" (click)="openDetailModal(b)" title="Ver / Imprimir Presupuesto">
                        👁️
                      </button>
                      @if (b.status === 'PENDING') {
                        <button class="btn-icon-action" (click)="openStatusModal(b)" title="Aprobar / Rechazar">
                          ⚖️
                        </button>
                        <button class="btn-icon-action" (click)="openEditModal(b)" title="Editar partidas">
                          ✏️
                        </button>
                        <button class="btn-icon-action delete" (click)="confirmDelete(b)" title="Eliminar">
                          🗑️
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- ══ PAGINACIÓN ════════════════════════════════════════════════════ -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <span class="page-info">
                Página {{ currentPage() + 1 }} de {{ totalPages() }} ({{ totalElements() }} registros)
              </span>
              <div class="page-controls">
                <button 
                  class="btn-page" 
                  [disabled]="currentPage() === 0" 
                  (click)="changePage(currentPage() - 1)">
                  ← Anterior
                </button>
                <button 
                  class="btn-page" 
                  [disabled]="currentPage() >= totalPages() - 1" 
                  (click)="changePage(currentPage() + 1)">
                  Siguiente →
                </button>
              </div>
            </div>
          }
        }
      </div>

    </div>

    <!-- ══ MODAL: CREAR / EDITAR PRESUPUESTO ═══════════════════════════════════ -->
    @if (showFormModal()) {
      <div class="modal-overlay" (click)="closeFormModal()">
        <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? '✏️ Modificar Presupuesto' : '➕ Emitir Nuevo Presupuesto' }}</h2>
            <button class="modal-close" (click)="closeFormModal()">✕</button>
          </div>

          <form [formGroup]="budgetForm" (ngSubmit)="submitBudget()" class="modal-form">

            @if (!editingId()) {
              <div class="form-group">
                <label>Orden de Reparación Vinculada *</label>
                <select formControlName="repairOrderId" class="form-control">
                  <option [ngValue]="null" disabled>-- Selecciona una orden activa --</option>
                  @for (order of availableOrders(); track order.id) {
                    <option [value]="order.id">
                      {{ order.orderNumber }} — {{ order.licensePlate }} ({{ order.customerName }}) [{{ order.status }}]
                    </option>
                  }
                </select>
                @if (budgetForm.get('repairOrderId')?.invalid && budgetForm.get('repairOrderId')?.touched) {
                  <span class="error-text">Debes seleccionar una orden de reparación</span>
                }
              </div>
            }

            <!-- ── PARTIDAS / LÍNEAS DE PRESUPUESTO ── -->
            <div class="items-section">
              <div class="section-subtitle-row">
                <span class="section-title">Conceptos y Partidas</span>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addItemRow()">
                  ＋ Añadir Partida
                </button>
              </div>

              <div formArrayName="items" class="items-table-wrap">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 22%">TIPO</th>
                      <th style="width: 38%">DESCRIPCIÓN</th>
                      <th style="width: 14%">CANTIDAD</th>
                      <th style="width: 14%">PRECIO UNIT.</th>
                      <th style="width: 12%">TOTAL</th>
                      <th style="width: 40px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of itemsFormArray.controls; track $index) {
                      <tr [formGroupName]="$index">
                        <td>
                          <select formControlName="itemType" class="form-control form-control-sm">
                            <option value="LABOR">⏱️ Mano de Obra</option>
                            <option value="PART">🔩 Recambio</option>
                            <option value="DIAGNOSIS">🔬 Diagnóstico</option>
                            <option value="OTHER">📦 Otro</option>
                          </select>
                        </td>
                        <td>
                          <input type="text" formControlName="description" class="form-control form-control-sm"
                                 placeholder="Ej. Pastillas delanteras Brembo" />
                        </td>
                        <td>
                          <input type="number" step="0.5" min="0.01" formControlName="quantity" 
                                 class="form-control form-control-sm text-right" (input)="recalculatePreview()" />
                        </td>
                        <td>
                          <input type="number" step="1.0" min="0.00" formControlName="unitPrice" 
                                 class="form-control form-control-sm text-right" (input)="recalculatePreview()" />
                        </td>
                        <td class="text-right font-mono font-bold">
                          {{ getItemTotal($index) | number:'1.2-2' }} €
                        </td>
                        <td class="text-center">
                          @if (itemsFormArray.length > 1) {
                            <button type="button" class="btn-remove-row" (click)="removeItemRow($index)">✕</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ── TOTALES Y RESUMEN ECONÓMICO ── -->
            <div class="calculation-summary">
              <div class="summary-notes">
                <label>Notas para el cliente</label>
                <textarea formControlName="customerNotes" class="form-control" rows="2"
                          placeholder="Observaciones, validez de la oferta, plazos de entrega..."></textarea>
              </div>

              <div class="summary-totals">
                <div class="total-row">
                  <span>Subtotal neto:</span>
                  <span class="font-mono font-bold">{{ computedSubtotal() | number:'1.2-2' }} €</span>
                </div>
                <div class="total-row">
                  <span>IVA (21.00%):</span>
                  <span class="font-mono text-muted">{{ computedTax() | number:'1.2-2' }} €</span>
                </div>
                <div class="total-row grand-total">
                  <span>TOTAL ESTIMADO:</span>
                  <span class="font-mono">{{ computedTotal() | number:'1.2-2' }} €</span>
                </div>
              </div>
            </div>

            @if (formError()) {
              <div class="alert alert-error">{{ formError() }}</div>
            }

            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" (click)="closeFormModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="budgetForm.invalid || submitting()">
                {{ submitting() ? 'Guardando...' : (editingId() ? '💾 Actualizar Presupuesto' : '✅ Emitir Presupuesto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ══ MODAL: DETALLE / FACTURA IMPRIMIBLE ════════════════════════════════ -->
    @if (showDetailModal()) {
      <div class="modal-overlay" (click)="showDetailModal.set(false)">
        <div class="modal-panel modal-lg invoice-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Presupuesto Oficial — {{ activeBudget()?.orderNumber }}</h2>
            <div class="header-actions-inline">
              <button class="btn btn-secondary btn-sm" (click)="printBudget()">🖨️ Imprimir</button>
              <button class="modal-close" (click)="showDetailModal.set(false)">✕</button>
            </div>
          </div>

          @if (activeBudget()) {
            <div class="invoice-body">
              <!-- Cabecera de Empresa -->
              <div class="invoice-company-header">
                <div class="company-brand">
                  <h2>🏎️ PADDOCK MANAGER</h2>
                  <p>Centro Técnico y Taller de Competición Automotriz</p>
                  <p class="company-meta">CIF: B-99887766 • C/ Circuito del Jarama, 12 • 28001 Madrid</p>
                </div>
                <div class="invoice-meta">
                  <div class="invoice-number">PRESUPUESTO #{{ activeBudget()!.id }}</div>
                  <div class="invoice-date">Fecha: {{ activeBudget()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  <div class="invoice-status">
                    Estado: <strong [style.color]="getStatusColors(activeBudget()!.status).text">
                      {{ getStatusLabel(activeBudget()!.status) }}
                    </strong>
                  </div>
                </div>
              </div>

              <!-- Ficha de Cliente y Vehículo -->
              <div class="invoice-client-grid">
                <div class="client-box">
                  <h4>DATOS DEL CLIENTE</h4>
                  <p><strong>Nombre:</strong> {{ activeBudget()!.customerName }}</p>
                  <p><strong>Teléfono:</strong> {{ activeBudget()!.customerPhone || 'N/D' }}</p>
                  <p><strong>Email:</strong> {{ activeBudget()!.customerEmail || 'N/D' }}</p>
                </div>
                <div class="vehicle-box">
                  <h4>VEHÍCULO</h4>
                  <p><strong>Matrícula:</strong> {{ activeBudget()!.licensePlate }}</p>
                  <p><strong>Modelo:</strong> {{ activeBudget()!.vehicleModel }}</p>
                  <p><strong>Orden de Trabajo:</strong> {{ activeBudget()!.orderNumber }}</p>
                </div>
              </div>

              <!-- Tabla de Partidas -->
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>CONCEPTO / DESCRIPCIÓN</th>
                    <th>TIPO</th>
                    <th class="text-right">CANTIDAD</th>
                    <th class="text-right">PRECIO UNIT.</th>
                    <th class="text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activeBudget()!.items; track item.id) {
                    <tr>
                      <td>{{ item.description }}</td>
                      <td>{{ getItemTypeLabel(item.itemType) }}</td>
                      <td class="text-right font-mono">{{ item.quantity | number:'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ item.unitPrice | number:'1.2-2' }} €</td>
                      <td class="text-right font-mono font-bold">{{ item.total | number:'1.2-2' }} €</td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Totales -->
              <div class="invoice-totals">
                <div class="notes-display">
                  @if (activeBudget()!.customerNotes) {
                    <p><strong>Observaciones:</strong> {{ activeBudget()!.customerNotes }}</p>
                  }
                </div>
                <div class="totals-display">
                  <div class="tot-row">
                    <span>Subtotal Neto:</span>
                    <span class="font-mono">{{ activeBudget()!.subtotal | number:'1.2-2' }} €</span>
                  </div>
                  <div class="tot-row">
                    <span>IVA ({{ activeBudget()!.taxRate }}%):</span>
                    <span class="font-mono">{{ activeBudget()!.taxAmount | number:'1.2-2' }} €</span>
                  </div>
                  <div class="tot-row tot-final">
                    <span>TOTAL A PAGAR:</span>
                    <span class="font-mono">{{ activeBudget()!.total | number:'1.2-2' }} €</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- ══ MODAL: APROBAR / RECHAZAR PRESUPUESTO ═══════════════════════════════ -->
    @if (showStatusModal()) {
      <div class="modal-overlay" (click)="showStatusModal.set(false)">
        <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Resolución de Presupuesto</h2>
            <button class="modal-close" (click)="showStatusModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>Orden: <strong>{{ activeBudget()?.orderNumber }}</strong> ({{ activeBudget()?.licensePlate }})</p>
            <p>Total Presupuesto: <strong>{{ activeBudget()?.total | number:'1.2-2' }} €</strong></p>

            <div class="form-group">
              <label>Resolución del Cliente *</label>
              <div class="status-choice-buttons">
                <button type="button" class="btn btn-outline-success" 
                        [class.active-btn]="targetStatus === 'APPROVED'"
                        (click)="targetStatus = 'APPROVED'">
                  ✅ APROBAR
                </button>
                <button type="button" class="btn btn-outline-danger" 
                        [class.active-btn]="targetStatus === 'REJECTED'"
                        (click)="targetStatus = 'REJECTED'">
                  ❌ RECHAZAR
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Notas de la resolución</label>
              <input type="text" [(ngModel)]="statusNotes" class="form-control"
                     placeholder="Ej. Aceptado telefónicamente / No desea reparar por coste" />
            </div>

            @if (targetStatus === 'APPROVED') {
              <p class="info-note">ℹ️ Al aprobarse el presupuesto, la orden de trabajo avanzará automáticamente al estado <strong>APROBADO</strong>.</p>
            }
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="showStatusModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="submitStatusChange()" [disabled]="submitting()">
              {{ submitting() ? 'Guardando...' : 'Confirmar Resolución' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ MODAL: CONFIRMACIÓN ELIMINAR ═══════════════════════════════════════ -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="showDeleteModal.set(false)">
        <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🗑️ Eliminar Presupuesto</h2>
            <button class="modal-close" (click)="showDeleteModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Seguro que deseas eliminar el presupuesto de la orden <strong>{{ activeBudget()?.orderNumber }}</strong>?</p>
            <p class="warning-text">⚠️ Esta acción eliminará todas las partidas presupuestadas.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="showDeleteModal.set(false)">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDelete()" [disabled]="submitting()">
              {{ submitting() ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .budgets-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    /* ── KPIS ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
      &.active-kpi { border-color: var(--accent-color); background: rgba(99, 102, 241, 0.08); }

      .kpi-icon { font-size: 2rem; }
      .kpi-content { display: flex; flex-direction: column; }
      .kpi-label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
      .kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }

      &.pending .kpi-value { color: #eab308; }
      &.approved .kpi-value { color: #22c55e; }
      &.revenue .kpi-value { color: #38bdf8; }
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 480px;

      .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .search-input {
        width: 100%;
        padding: 0.6rem 2.2rem 0.6rem 2.2rem;
        background: var(--input-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.875rem;
        outline: none;
        &:focus { border-color: var(--accent-color); }
      }

      .clear-search {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
      }
    }

    .status-tabs {
      display: flex;
      gap: 0.4rem;
      background: var(--card-bg);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);

      .tab-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.45rem 0.85rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover { color: var(--text-primary); }
        &.active {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        &.pending.active { background: rgba(234, 179, 8, 0.2); color: #eab308; }
        &.approved.active { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        &.rejected.active { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      }
    }

    /* ── Tabla ── */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        background: rgba(255, 255, 255, 0.02);
        padding: 0.85rem 1rem;
        text-align: left;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        color: var(--text-primary);
        vertical-align: middle;
      }

      tbody tr:hover {
        background: rgba(255, 255, 255, 0.015);
      }
    }

    .order-badge {
      font-weight: 700;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.1);
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .plate-badge {
      background: #facc15;
      color: #000;
      font-weight: 800;
      font-family: monospace;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      border: 1px solid #ca8a04;
    }

    .vehicle-cell, .customer-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .vehicle-model, .customer-phone {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .items-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .total-cell {
      color: #22c55e;
      font-size: 0.95rem;
    }

    .status-pill {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid transparent;
    }

    .action-buttons {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }

    .btn-icon-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.35rem 0.5rem;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s;

      &:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-1px); }
      &.delete:hover { background: rgba(239, 68, 68, 0.2); }
    }

    /* ── Botones Genéricos ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;

      &:disabled { opacity: 0.5; cursor: not-allowed; }

      &.btn-primary {
        background: var(--accent-color);
        color: #fff;
        &:hover:not(:disabled) { filter: brightness(1.1); }
      }

      &.btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.14); }
      }

      &.btn-danger {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.3); }
      }

      &.btn-ghost {
        background: transparent;
        color: var(--text-secondary);
        &:hover { color: var(--text-primary); }
      }

      &.btn-sm { padding: 0.35rem 0.65rem; font-size: 0.78rem; }
    }

    .btn-outline-success {
      background: transparent;
      border: 2px solid #22c55e;
      color: #22c55e;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      flex: 1;
      &.active-btn { background: #22c55e; color: #000; }
    }

    .btn-outline-danger {
      background: transparent;
      border: 2px solid #ef4444;
      color: #ef4444;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      flex: 1;
      &.active-btn { background: #ef4444; color: #fff; }
    }

    .status-choice-buttons { display: flex; gap: 0.75rem; margin-top: 0.5rem; }

    /* ── Modales ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-panel.modal-lg { max-width: 850px; }
    .modal-panel.modal-sm { max-width: 440px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h2 { font-size: 1.15rem; margin: 0; color: var(--text-primary); }
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      &:hover { color: var(--text-primary); }
    }

    .modal-form, .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }
    }

    .form-control {
      width: 100%;
      padding: 0.55rem 0.75rem;
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
      &:focus { border-color: var(--accent-color); }
    }

    .form-control-sm { padding: 0.4rem 0.6rem; font-size: 0.8rem; }

    .error-text { font-size: 0.75rem; color: #ef4444; }
    .warning-text { font-size: 0.82rem; color: #f59e0b; }
    .info-note { font-size: 0.8rem; color: #38bdf8; line-height: 1.4; }

    /* ── Items Table Inside Modal ── */
    .items-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-subtitle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .items-table-wrap {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;

      th {
        background: rgba(255, 255, 255, 0.04);
        padding: 0.5rem 0.75rem;
        text-align: left;
        color: var(--text-secondary);
        font-size: 0.7rem;
      }

      td {
        padding: 0.4rem 0.6rem;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        vertical-align: middle;
      }
    }

    .btn-remove-row {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      &:hover { transform: scale(1.2); }
    }

    /* ── Totales y Resumen ── */
    .calculation-summary {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .summary-totals {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      justify-content: center;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);

      &.grand-total {
        font-size: 1.05rem;
        font-weight: 800;
        color: #22c55e;
        border-top: 1px solid var(--border-color);
        padding-top: 0.5rem;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    /* ── Invoice View ── */
    .invoice-body {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .invoice-company-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 1.25rem;

      h2 { margin: 0; color: #fff; font-size: 1.3rem; letter-spacing: 0.05em; }
      p { margin: 0.2rem 0; font-size: 0.8rem; color: var(--text-secondary); }
      .company-meta { font-size: 0.75rem; }
    }

    .invoice-meta {
      text-align: right;
      .invoice-number { font-size: 1.1rem; font-weight: 800; color: #818cf8; }
      .invoice-date, .invoice-status { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; }
    }

    .invoice-client-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      .client-box, .vehicle-box {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.85rem 1rem;

        h4 { margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 0.05em; }
        p { margin: 0.25rem 0; font-size: 0.82rem; }
      }
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      th {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.65rem 0.85rem;
        text-align: left;
        color: var(--text-secondary);
        font-size: 0.72rem;
      }

      td {
        padding: 0.65rem 0.85rem;
        border-bottom: 1px solid var(--border-color);
      }
    }

    .invoice-totals {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      margin-top: 0.5rem;

      .totals-display {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tot-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--text-secondary);

        &.tot-final {
          font-size: 1.1rem;
          font-weight: 800;
          color: #22c55e;
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }
      }
    }

    /* ── Paginación y utilidades ── */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.8rem;
      color: var(--text-secondary);

      .btn-page {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        margin-left: 0.5rem;
        &:disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }

    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-muted { color: var(--text-secondary); }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--text-secondary);
      .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
      h3 { color: var(--text-primary); margin-bottom: 0.5rem; }
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--accent-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      &.alert-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
      &.alert-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
      .alert-close { background: none; border: none; color: inherit; cursor: pointer; }
    }
  `]
})
export class BudgetsComponent implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly repairOrderService = inject(RepairOrderService);
  private readonly fb = inject(FormBuilder);

  // ── Estados ───────────────────────────────────────────────────────────────
  budgets = signal<Budget[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  loading = signal(false);

  searchQuery = '';
  readonly selectedStatus = signal<BudgetStatus | 'ALL'>('ALL');

  errorMessage = signal('');
  successMessage = signal('');

  // ── Modales ───────────────────────────────────────────────────────────────
  showFormModal = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);
  formError = signal('');

  showDetailModal = signal(false);
  showStatusModal = signal(false);
  showDeleteModal = signal(false);

  activeBudget = signal<Budget | null>(null);
  availableOrders = signal<RepairOrder[]>([]);

  targetStatus: BudgetStatus = 'APPROVED';
  statusNotes = '';

  // ── Formulario Reactivo ────────────────────────────────────────────────────
  budgetForm: FormGroup = this.fb.group({
    repairOrderId: [null, [Validators.required]],
    taxRate: [21.00, [Validators.required, Validators.min(0)]],
    customerNotes: [''],
    items: this.fb.array([])
  });

  // ── Cálculos Reactivos ────────────────────────────────────────────────────
  computedSubtotal = signal(0);
  computedTax = signal(0);
  computedTotal = signal(0);

  // KPIs computados
  countPending = computed(() => this.budgets().filter(b => b.status === 'PENDING').length);
  countApproved = computed(() => this.budgets().filter(b => b.status === 'APPROVED').length);
  totalApprovedRevenue = computed(() => 
    this.budgets()
      .filter(b => b.status === 'APPROVED')
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0)
  );

  get itemsFormArray(): FormArray {
    return this.budgetForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.loading.set(true);
    const statusParam = this.selectedStatus() === 'ALL' ? undefined : (this.selectedStatus() as BudgetStatus);

    this.budgetService.getBudgets(
      statusParam,
      this.searchQuery,
      this.currentPage(),
      10
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.budgets.set(res.data.content);
          this.totalPages.set(res.data.totalPages);
          this.totalElements.set(res.data.totalElements);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error cargando presupuestos');
        this.loading.set(false);
      }
    });
  }

  loadAvailableOrders(): void {
    this.repairOrderService.getRepairOrders(undefined, undefined, undefined, undefined, undefined, undefined, 0, 50)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Filtrar órdenes que no estén cerradas
            this.availableOrders.set(
              res.data.content.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
            );
          }
        }
      });
  }

  // ── Búsqueda y Paginación ─────────────────────────────────────────────────
  onSearchChange(): void {
    this.currentPage.set(0);
    this.loadBudgets();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.loadBudgets();
  }

  filterByStatus(status: BudgetStatus | 'ALL'): void {
    this.selectedStatus.set(status);
    this.currentPage.set(0);
    this.loadBudgets();
  }

  changePage(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadBudgets();
  }

  // ── Gestión de Partidas Dinámicas ──
  addItemRow(item?: Partial<BudgetItemResponse>): void {
    const itemGroup = this.fb.group({
      itemType: [item?.itemType || 'LABOR', [Validators.required]],
      description: [item?.description || '', [Validators.required, Validators.minLength(2)]],
      quantity: [item?.quantity ?? 1.0, [Validators.required, Validators.min(0.01)]],
      unitPrice: [item?.unitPrice ?? 45.0, [Validators.required, Validators.min(0)]]
    });
    this.itemsFormArray.push(itemGroup);
    this.recalculatePreview();
  }

  removeItemRow(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
      this.recalculatePreview();
    }
  }

  getItemTotal(index: number): number {
    const row = this.itemsFormArray.at(index);
    if (!row) return 0;
    const qty = Number(row.get('quantity')?.value) || 0;
    const price = Number(row.get('unitPrice')?.value) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  recalculatePreview(): void {
    let subtotal = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      subtotal += this.getItemTotal(i);
    }
    const taxRate = Number(this.budgetForm.get('taxRate')?.value) || 21.00;
    const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    this.computedSubtotal.set(subtotal);
    this.computedTax.set(tax);
    this.computedTotal.set(total);
  }

  // ── Modales ───────────────────────────────────────────────────────────────
  openCreateModal(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.budgetForm.reset({
      repairOrderId: null,
      taxRate: 21.00,
      customerNotes: ''
    });
    this.itemsFormArray.clear();
    this.addItemRow({ itemType: 'LABOR', description: 'Mano de obra diagnóstico y reparación', quantity: 1, unitPrice: 45.0 });
    this.loadAvailableOrders();
    this.showFormModal.set(true);
  }

  openEditModal(b: Budget): void {
    this.editingId.set(b.id);
    this.formError.set('');
    this.budgetForm.reset({
      repairOrderId: b.repairOrderId,
      taxRate: b.taxRate,
      customerNotes: b.customerNotes || ''
    });
    this.itemsFormArray.clear();
    if (b.items && b.items.length > 0) {
      b.items.forEach(item => this.addItemRow(item));
    } else {
      this.addItemRow();
    }
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingId.set(null);
    this.budgetForm.reset();
  }

  submitBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.formError.set('');

    const formVal = this.budgetForm.getRawValue();
    const reqDto: BudgetRequest = {
      repairOrderId: Number(formVal.repairOrderId),
      taxRate: Number(formVal.taxRate) || 21.00,
      customerNotes: formVal.customerNotes || undefined,
      items: formVal.items.map((i: any) => ({
        itemType: i.itemType,
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice)
      }))
    };

    const id = this.editingId();
    const obs$ = id
      ? this.budgetService.update(id, reqDto)
      : this.budgetService.create(reqDto);

    obs$.subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(id ? 'Presupuesto actualizado correctamente' : 'Presupuesto generado con éxito');
          this.closeFormModal();
          this.loadBudgets();
          setTimeout(() => this.successMessage.set(''), 4000);
        }
        this.submitting.set(false);
      },
      error: (err) => {
        this.formError.set(err?.error?.message || 'Error guardando presupuesto');
        this.submitting.set(false);
      }
    });
  }

  openDetailModal(b: Budget): void {
    this.activeBudget.set(b);
    this.showDetailModal.set(true);
  }

  printBudget(): void {
    window.print();
  }

  openStatusModal(b: Budget): void {
    this.activeBudget.set(b);
    this.targetStatus = 'APPROVED';
    this.statusNotes = '';
    this.showStatusModal.set(true);
  }

  submitStatusChange(): void {
    const b = this.activeBudget();
    if (!b) return;

    this.submitting.set(true);
    this.budgetService.changeStatus(b.id, {
      newStatus: this.targetStatus,
      notes: this.statusNotes || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(`Presupuesto ${this.getStatusLabel(this.targetStatus).toLowerCase()} con éxito`);
          this.showStatusModal.set(false);
          this.loadBudgets();
          setTimeout(() => this.successMessage.set(''), 4000);
        }
        this.submitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Error cambiando estado');
        this.submitting.set(false);
        this.showStatusModal.set(false);
      }
    });
  }

  confirmDelete(b: Budget): void {
    this.activeBudget.set(b);
    this.showDeleteModal.set(true);
  }

  executeDelete(): void {
    const b = this.activeBudget();
    if (!b) return;

    this.submitting.set(true);
    this.budgetService.delete(b.id).subscribe({
      next: () => {
        this.successMessage.set('Presupuesto eliminado');
        this.showDeleteModal.set(false);
        this.loadBudgets();
        this.submitting.set(false);
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'No se pudo eliminar el presupuesto');
        this.showDeleteModal.set(false);
        this.submitting.set(false);
      }
    });
  }

  // ── Helpers ──
  getStatusLabel(status: BudgetStatus): string {
    return BUDGET_STATUS_LABELS[status] || status;
  }

  getStatusColors(status: BudgetStatus) {
    return BUDGET_STATUS_COLORS[status] || { bg: '#333', text: '#fff', border: '#555' };
  }

  getItemTypeLabel(type: BudgetItemType): string {
    const item = BUDGET_ITEM_TYPE_LABELS[type];
    return item ? `${item.icon} ${item.label}` : type;
  }
}
