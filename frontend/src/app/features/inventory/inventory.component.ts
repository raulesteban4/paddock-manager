import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PartService } from '../../core/services/part.service';
import { Part, PartRequest, StockAdjustment, InventoryStats } from '../../core/models/part.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="inventory-container">

      <!-- ══ HEADER ════════════════════════════════════════════════════════════ -->
      <div class="page-header">
        <div class="header-info">
          <h1 class="page-title">📦 Inventario & Repuestos</h1>
          <p class="page-subtitle">Control de stock, alertas de reposición, precios y valoración global del almacén</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadAllData()" [disabled]="loading()">
            <span class="btn-icon">🔄</span> Actualizar
          </button>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span class="btn-icon">＋</span> Nuevo Repuesto
          </button>
        </div>
      </div>

      <!-- ══ KPIS METRICS ══════════════════════════════════════════════════════ -->
      <div class="kpi-grid">
        <div class="kpi-card" (click)="setFilter(false)" [class.active-kpi]="!lowStockFilter()">
          <div class="kpi-icon">📦</div>
          <div class="kpi-content">
            <span class="kpi-label">Referencias Activas</span>
            <span class="kpi-value">{{ stats()?.totalParts ?? 0 }}</span>
          </div>
        </div>

        <div class="kpi-card warning" (click)="setFilter(true)" [class.active-kpi]="lowStockFilter()">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-content">
            <span class="kpi-label">Stock Bajo / Reposición</span>
            <span class="kpi-value warning-value">{{ stats()?.lowStockCount ?? 0 }}</span>
          </div>
        </div>

        <div class="kpi-card cost">
          <div class="kpi-icon">🏷️</div>
          <div class="kpi-content">
            <span class="kpi-label">Valoración Coste</span>
            <span class="kpi-value">{{ (stats()?.totalCostValue ?? 0) | number:'1.2-2' }} €</span>
          </div>
        </div>

        <div class="kpi-card retail">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Valoración Venta</span>
            <span class="kpi-value text-green">{{ (stats()?.totalRetailValue ?? 0) | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- ══ TOOLBAR & FILTERS ═════════════════════════════════════════════════ -->
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Buscar por referencia, nombre, fabricante o proveedor..." 
            class="search-input"
          />
          @if (searchQuery) {
            <button class="clear-search" (click)="clearSearch()">✕</button>
          }
        </div>

        <div class="filter-tabs">
          <button 
            class="tab-btn" 
            [class.active]="!lowStockFilter()" 
            (click)="setFilter(false)">
            Todas las piezas
          </button>
          <button 
            class="tab-btn alert-tab" 
            [class.active]="lowStockFilter()" 
            (click)="setFilter(true)">
            ⚠️ Stock Bajo ({{ stats()?.lowStockCount ?? 0 }})
          </button>
        </div>
      </div>

      <!-- ══ ALERTS ════════════════════════════════════════════════════════════ -->
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

      <!-- ══ PARTS TABLE ═══════════════════════════════════════════════════════ -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Consultando catálogo de repuestos...</p>
          </div>
        } @else if (parts().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>No se encontraron piezas</h3>
            <p>{{ lowStockFilter() ? '¡Excelente! No hay piezas con stock crítico o por debajo del umbral mínimo.' : 'No hay referencias registradas en el almacén.' }}</p>
            @if (!lowStockFilter()) {
              <button class="btn btn-primary" (click)="openCreateModal()">+ Registrar Primera Pieza</button>
            }
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>REFERENCIA</th>
                <th>DESCRIPCIÓN / PIEZA</th>
                <th>FABRICANTE & PROVEEDOR</th>
                <th>EXISTENCIAS</th>
                <th>P. COSTE</th>
                <th>P. VENTA</th>
                <th>MARGEN</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (p of parts(); track p.id) {
                <tr [class.warning-row]="p.lowStock">
                  <td>
                    <span class="ref-badge">{{ p.referenceCode }}</span>
                  </td>
                  <td>
                    <div class="part-info">
                      <span class="part-name">{{ p.name }}</span>
                      @if (p.description) {
                        <span class="part-desc">{{ p.description }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="supplier-info">
                      <span class="manufacturer-name">{{ p.manufacturer || 'Sin marca especificada' }}</span>
                      <span class="supplier-name">Dist: {{ p.supplier || 'N/A' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="stock-cell">
                      <span class="stock-counts">
                        <strong>{{ p.stock }}</strong> u. <span class="text-muted">/ min {{ p.minStock }}</span>
                      </span>
                      @if (p.stock === 0) {
                        <span class="stock-pill pill-danger">🚨 Agotado</span>
                      } @else if (p.lowStock) {
                        <span class="stock-pill pill-warning">⚠️ Stock Bajo</span>
                      } @else {
                        <span class="stock-pill pill-success">✓ Óptimo</span>
                      }
                    </div>
                  </td>
                  <td class="font-mono">{{ p.costPrice | number:'1.2-2' }} €</td>
                  <td class="font-mono font-bold">{{ p.unitPrice | number:'1.2-2' }} €</td>
                  <td>
                    <span class="margin-badge" [class.margin-positive]="calculateMargin(p.unitPrice, p.costPrice) >= 0">
                      {{ calculateMargin(p.unitPrice, p.costPrice) | number:'1.0-1' }}%
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="btn-icon-action adjust" (click)="openAdjustModal(p)" title="Ajuste Rápido de Stock">
                        ⚡
                      </button>
                      <button class="btn-icon-action edit" (click)="openEditModal(p)" title="Editar Datos">
                        ✏️
                      </button>
                      <button class="btn-icon-action delete" (click)="confirmDelete(p)" title="Eliminar Pieza">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- ══ PAGINATION ═════════════════════════════════════════════════════ -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <span class="page-info">
                Página {{ currentPage() + 1 }} de {{ totalPages() }} ({{ totalElements() }} referencias)
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

    <!-- ══ MODAL: CREAR / EDITAR PIEZA ═════════════════════════════════════════ -->
    @if (showFormModal()) {
      <div class="modal-overlay" (click)="closeFormModal()">
        <div class="modal-panel modal-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? '✏️ Editar Repuesto' : '➕ Nueva Pieza en Inventario' }}</h2>
            <button class="modal-close" (click)="closeFormModal()">✕</button>
          </div>

          <form [formGroup]="partForm" (ngSubmit)="submitPart()" class="modal-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Código de Referencia *</label>
                <input 
                  type="text" 
                  formControlName="referenceCode" 
                  class="form-control font-mono uppercase" 
                  placeholder="Ej. FIL-ACE-01" 
                />
                @if (partForm.get('referenceCode')?.invalid && partForm.get('referenceCode')?.touched) {
                  <span class="error-text">El código de referencia es obligatorio (mín 2 car.)</span>
                }
              </div>

              <div class="form-group flex-2">
                <label>Nombre de la Pieza *</label>
                <input 
                  type="text" 
                  formControlName="name" 
                  class="form-control" 
                  placeholder="Ej. Filtro de Aceite Mann W712" 
                />
                @if (partForm.get('name')?.invalid && partForm.get('name')?.touched) {
                  <span class="error-text">El nombre es obligatorio (mín 2 car.)</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Fabricante / Marca</label>
                <input 
                  type="text" 
                  formControlName="manufacturer" 
                  class="form-control" 
                  placeholder="Ej. Mann-Filter, Brembo, Bosch" 
                />
              </div>

              <div class="form-group flex-1">
                <label>Proveedor Habitual</label>
                <input 
                  type="text" 
                  formControlName="supplier" 
                  class="form-control" 
                  placeholder="Ej. Recambios Sur, AutoDoc" 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ editingId() ? 'Stock Actual' : 'Stock Inicial *' }}</label>
                <input 
                  type="number" 
                  formControlName="stock" 
                  class="form-control font-mono" 
                  min="0" 
                  placeholder="0" 
                />
                @if (partForm.get('stock')?.invalid && partForm.get('stock')?.touched) {
                  <span class="error-text">El stock no puede ser negativo</span>
                }
              </div>

              <div class="form-group flex-1">
                <label>Stock Mínimo (Alerta) *</label>
                <input 
                  type="number" 
                  formControlName="minStock" 
                  class="form-control font-mono" 
                  min="0" 
                  placeholder="5" 
                />
                @if (partForm.get('minStock')?.invalid && partForm.get('minStock')?.touched) {
                  <span class="error-text">El stock mínimo es obligatorio (≥ 0)</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Precio Coste (€ s/IVA) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  formControlName="costPrice" 
                  class="form-control font-mono" 
                  placeholder="0.00" 
                />
                @if (partForm.get('costPrice')?.invalid && partForm.get('costPrice')?.touched) {
                  <span class="error-text">El precio de coste no puede ser negativo</span>
                }
              </div>

              <div class="form-group flex-1">
                <label>Precio Venta Cliente (€ s/IVA) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  formControlName="unitPrice" 
                  class="form-control font-mono" 
                  placeholder="0.00" 
                />
                @if (partForm.get('unitPrice')?.invalid && partForm.get('unitPrice')?.touched) {
                  <span class="error-text">El precio de venta no puede ser negativo</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label>Descripción Técnica / Compatibilidad</label>
              <textarea 
                formControlName="description" 
                class="form-control textarea" 
                rows="2" 
                placeholder="Especificaciones, modelos compatibles o notas del almacén..."
              ></textarea>
            </div>

            <!-- Preview Margen Comercial -->
            <div class="preview-box">
              <span class="preview-label">Margen comercial proyectado:</span>
              <span class="preview-value font-mono">
                {{ calculateMargin(partForm.get('unitPrice')?.value, partForm.get('costPrice')?.value) | number:'1.1-1' }}%
                ({{ ((partForm.get('unitPrice')?.value || 0) - (partForm.get('costPrice')?.value || 0)) | number:'1.2-2' }} €/ud)
              </span>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" (click)="closeFormModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="partForm.invalid || submitting()">
                {{ submitting() ? 'Guardando...' : (editingId() ? 'Actualizar Repuesto' : 'Crear Repuesto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ══ MODAL: AJUSTE RÁPIDO DE STOCK ════════════════════════════════════════ -->
    @if (showAdjustModal()) {
      <div class="modal-overlay" (click)="showAdjustModal.set(false)">
        <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>⚡ Ajuste Rápido de Stock</h2>
            <button class="modal-close" (click)="showAdjustModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="adjust-header-info">
              <span class="ref-badge">{{ selectedPart()?.referenceCode }}</span>
              <h4 class="adjust-title">{{ selectedPart()?.name }}</h4>
              <p class="adjust-current">Existencias actuales: <strong>{{ selectedPart()?.stock }}</strong> unidades</p>
            </div>

            <div class="form-group">
              <label>Tipo de Operación</label>
              <div class="operation-buttons">
                <button 
                  type="button" 
                  class="btn-op positive" 
                  [class.active]="adjustMode === 'ADD'"
                  (click)="adjustMode = 'ADD'">
                  ➕ Entrada / Recepción
                </button>
                <button 
                  type="button" 
                  class="btn-op negative" 
                  [class.active]="adjustMode === 'SUBTRACT'"
                  (click)="adjustMode = 'SUBTRACT'">
                  ➖ Salida / Consumo
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Cantidad de unidades *</label>
              <input 
                type="number" 
                [(ngModel)]="adjustQuantity" 
                class="form-control font-mono font-bold text-center" 
                min="1" 
                placeholder="1" 
              />
            </div>

            <div class="form-group">
              <label>Motivo del ajuste</label>
              <input 
                type="text" 
                [(ngModel)]="adjustReason" 
                class="form-control" 
                placeholder="Ej. Albarán ALB-2026-042 / Merma / Consumo orden" 
              />
            </div>

            <!-- Previsualización de Stock Resultante -->
            <div class="resulting-stock-card" [class.negative-stock]="resultingStock() < 0">
              <span>Stock resultante tras el ajuste:</span>
              <strong class="font-mono text-lg">{{ resultingStock() }} unidades</strong>
              @if (resultingStock() < 0) {
                <span class="error-msg">⚠️ No se puede ajustar: el almacén no permite stock negativo.</span>
              }
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" (click)="showAdjustModal.set(false)">Cancelar</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              [disabled]="submitting() || adjustQuantity <= 0 || resultingStock() < 0" 
              (click)="submitStockAdjustment()">
              {{ submitting() ? 'Ajustando...' : 'Confirmar Ajuste' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ MODAL: CONFIRMAR ELIMINACIÓN ═════════════════════════════════════════ -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="showDeleteModal.set(false)">
        <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>⚠️ Confirmar Eliminación</h2>
            <button class="modal-close" (click)="showDeleteModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que deseas eliminar la pieza <strong>{{ selectedPart()?.name }}</strong> (ref: <code>{{ selectedPart()?.referenceCode }}</code>)?</p>
            <p class="warning-text">Esta acción borrará la ficha del catálogo y sus datos de existencias.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="showDeleteModal.set(false)">Cancelar</button>
            <button class="btn btn-danger" (click)="submitDelete()" [disabled]="submitting()">
              {{ submitting() ? 'Eliminando...' : 'Eliminar Definitivamente' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .inventory-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-info .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0 0 0.25rem 0;
    }

    .header-info .page-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* ── KPIS ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &.active-kpi {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px var(--primary-border);
      }

      &.warning.active-kpi {
        border-color: var(--warning);
        box-shadow: 0 0 0 2px var(--warning-border);
      }
    }

    .kpi-icon {
      font-size: 2rem;
      background: var(--bg-app);
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .warning-value {
      color: var(--warning);
    }

    .text-green {
      color: var(--success);
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      padding: 0.65rem 2.2rem 0.65rem 2.5rem;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      background: var(--card-bg);
      color: var(--text-main);
      font-size: 0.9rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
    }

    .clear-search {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      &:hover { color: var(--text-main); }
    }

    .filter-tabs {
      display: flex;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      gap: 0.25rem;
    }

    .tab-btn {
      background: transparent;
      border: none;
      padding: 0.45rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s;

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--bg-app);
        color: var(--text-main);
        box-shadow: var(--shadow-sm);
      }

      &.alert-tab.active {
        background: var(--warning-bg);
        color: var(--warning);
        font-weight: 700;
      }
    }

    /* ── Alerts ── */
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .alert-error {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid var(--danger-border);
    }

    .alert-success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid var(--success-border);
    }

    .alert-close {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: inherit;
    }

    /* ── Table ── */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;

      th {
        text-align: left;
        padding: 0.85rem 1rem;
        background: var(--bg-app);
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--card-border);
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-main);
      }

      tbody tr:hover {
        background: rgba(0, 0, 0, 0.015);
      }

      tbody tr.warning-row {
        background: #fffbeb;
      }
    }

    .ref-badge {
      font-family: monospace;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .part-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .part-name {
      font-weight: 600;
      color: var(--text-main);
    }

    .part-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .supplier-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .manufacturer-name {
      font-weight: 600;
      font-size: 0.82rem;
    }

    .supplier-name {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .stock-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stock-counts {
      font-size: 0.85rem;
    }

    .stock-pill {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      width: fit-content;

      &.pill-success {
        background: var(--success-bg);
        color: var(--success);
        border: 1px solid var(--success-border);
      }

      &.pill-warning {
        background: var(--warning-bg);
        color: var(--warning);
        border: 1px solid var(--warning-border);
      }

      &.pill-danger {
        background: var(--danger-bg);
        color: var(--danger);
        border: 1px solid var(--danger-border);
      }
    }

    .margin-badge {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      font-weight: 700;
      background: #f1f5f9;
      color: var(--text-muted);

      &.margin-positive {
        background: #f0fdf4;
        color: var(--success);
      }
    }

    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .btn-icon-action {
      background: var(--bg-app);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.55rem;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s;

      &:hover {
        background: #e2e8f0;
        transform: translateY(-1px);
      }

      &.adjust:hover { background: #fef08a; }
      &.edit:hover { background: #bae6fd; }
      &.delete:hover { background: #fecaca; }
    }

    /* ── Pagination ── */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: var(--bg-app);
      border-top: 1px solid var(--card-border);
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .btn-page {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      margin-left: 0.5rem;

      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &:hover:not(:disabled) { background: #f8fafc; }
    }

    /* ── States ── */
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-muted);

      .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
      h3 { color: var(--text-main); font-size: 1.15rem; margin-bottom: 0.25rem; }
      p { font-size: 0.85rem; max-width: 450px; margin: 0 auto 1rem auto; }
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--card-border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem auto;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Modales ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-panel {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--card-border);
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;

      &.modal-sm { max-width: 450px; }
      &.modal-md { max-width: 620px; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 { font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--text-main); }
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: var(--text-muted);
      &:hover { color: var(--text-main); }
    }

    .modal-form, .modal-body {
      padding: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      @media (max-width: 600px) { flex-direction: column; gap: 0.75rem; }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;

      &.flex-1 { flex: 1; margin-bottom: 0; }
      &.flex-2 { flex: 2; margin-bottom: 0; }

      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-main);
      }
    }

    .form-control {
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      background: #fff;
      color: var(--text-main);

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      &.textarea { resize: vertical; min-height: 60px; font-family: inherit; }
      &.uppercase { text-transform: uppercase; }
      &.text-center { text-align: center; }
      &.text-lg { font-size: 1.2rem; }
    }

    .error-text {
      color: var(--danger);
      font-size: 0.75rem;
    }

    .preview-box {
      background: var(--bg-app);
      border: 1px dashed var(--card-border);
      border-radius: var(--radius-sm);
      padding: 0.65rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;

      .preview-label { color: var(--text-muted); font-weight: 600; }
      .preview-value { color: var(--success); font-weight: 700; }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--card-border);
    }

    /* ── Stock Adjustment Special Styles ── */
    .adjust-header-info {
      text-align: center;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--card-border);

      .adjust-title { font-size: 1.05rem; margin: 0.5rem 0 0.25rem 0; color: var(--text-main); }
      .adjust-current { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
    }

    .operation-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-op {
      flex: 1;
      padding: 0.6rem 0.5rem;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      background: var(--bg-app);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;

      &.positive.active {
        background: var(--success-bg);
        color: var(--success);
        border-color: var(--success-border);
      }

      &.negative.active {
        background: var(--danger-bg);
        color: var(--danger);
        border-color: var(--danger-border);
      }
    }

    .resulting-stock-card {
      background: var(--bg-app);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      margin-top: 1rem;

      span { font-size: 0.82rem; color: var(--text-muted); }
      strong { font-size: 1.25rem; color: var(--text-main); }

      &.negative-stock {
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        strong { color: var(--danger); }
      }

      .error-msg {
        color: var(--danger);
        font-size: 0.78rem;
        font-weight: 600;
        margin-top: 0.25rem;
      }
    }

    .warning-text {
      color: var(--danger);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    /* ── Botones Genéricos ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
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

      &.btn-danger {
        background: var(--danger);
        color: #fff;
        &:hover:not(:disabled) { background: #b91c1c; }
      }

      &.btn-ghost {
        background: transparent;
        color: var(--text-muted);
        &:hover { color: var(--text-main); }
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  private readonly partService = inject(PartService);
  private readonly fb = inject(FormBuilder);

  // States
  parts = signal<Part[]>([]);
  stats = signal<InventoryStats | null>(null);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Pagination & Filtering
  searchQuery = '';
  lowStockFilter = signal<boolean>(false);
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);

  // Modals
  showFormModal = signal<boolean>(false);
  showAdjustModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  editingId = signal<number | null>(null);
  selectedPart = signal<Part | null>(null);

  // Fast Adjustment
  adjustMode: 'ADD' | 'SUBTRACT' = 'ADD';
  adjustQuantity: number = 1;
  adjustReason: string = '';

  // Form
  partForm: FormGroup = this.fb.group({
    referenceCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    description: [''],
    manufacturer: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    minStock: [5, [Validators.required, Validators.min(0)]],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    supplier: ['']
  });

  resultingStock = computed(() => {
    const part = this.selectedPart();
    if (!part) return 0;
    const delta = this.adjustMode === 'ADD' ? this.adjustQuantity : -this.adjustQuantity;
    return (part.stock || 0) + (delta || 0);
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadStats();
    this.loadParts();
  }

  loadStats(): void {
    this.partService.getStats().subscribe({
      next: (res) => {
        if (res.data) this.stats.set(res.data);
      },
      error: () => {
        // Fallback or silent stats error
      }
    });
  }

  loadParts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const lowStockParam = this.lowStockFilter() ? true : undefined;

    this.partService.getParts(
      this.searchQuery,
      lowStockParam,
      this.currentPage(),
      this.pageSize(),
      'name,asc'
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        const page = res.data;
        this.parts.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al conectar con el servidor de inventario');
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(0);
    this.loadParts();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.loadParts();
  }

  setFilter(lowStock: boolean): void {
    if (this.lowStockFilter() !== lowStock) {
      this.lowStockFilter.set(lowStock);
      this.currentPage.set(0);
      this.loadParts();
    }
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadParts();
    }
  }

  calculateMargin(unitPrice: number | null | undefined, costPrice: number | null | undefined): number {
    const up = Number(unitPrice) || 0;
    const cp = Number(costPrice) || 0;
    if (cp <= 0) return 0;
    return ((up - cp) / cp) * 100;
  }

  // ── Modal Create / Edit ──
  openCreateModal(): void {
    this.editingId.set(null);
    this.partForm.reset({
      referenceCode: '',
      name: '',
      description: '',
      manufacturer: '',
      stock: 0,
      minStock: 5,
      costPrice: 0,
      unitPrice: 0,
      supplier: ''
    });
    this.showFormModal.set(true);
  }

  openEditModal(part: Part): void {
    this.editingId.set(part.id);
    this.partForm.patchValue({
      referenceCode: part.referenceCode,
      name: part.name,
      description: part.description || '',
      manufacturer: part.manufacturer || '',
      stock: part.stock,
      minStock: part.minStock,
      costPrice: part.costPrice,
      unitPrice: part.unitPrice,
      supplier: part.supplier || ''
    });
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingId.set(null);
  }

  submitPart(): void {
    if (this.partForm.invalid) return;

    this.submitting.set(true);
    const dto: PartRequest = {
      referenceCode: this.partForm.value.referenceCode.trim().toUpperCase(),
      name: this.partForm.value.name.trim(),
      description: this.partForm.value.description ? this.partForm.value.description.trim() : undefined,
      manufacturer: this.partForm.value.manufacturer ? this.partForm.value.manufacturer.trim() : undefined,
      stock: Number(this.partForm.value.stock),
      minStock: Number(this.partForm.value.minStock),
      costPrice: Number(this.partForm.value.costPrice),
      unitPrice: Number(this.partForm.value.unitPrice),
      supplier: this.partForm.value.supplier ? this.partForm.value.supplier.trim() : undefined
    };

    const action$ = this.editingId() 
      ? this.partService.update(this.editingId()!, dto)
      : this.partService.create(dto);

    action$.subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.closeFormModal();
        this.successMessage.set(res.message || 'Pieza guardada correctamente');
        this.loadAllData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al guardar la pieza');
      }
    });
  }

  // ── Modal Stock Adjustment ──
  openAdjustModal(part: Part): void {
    this.selectedPart.set(part);
    this.adjustMode = 'ADD';
    this.adjustQuantity = 1;
    this.adjustReason = '';
    this.showAdjustModal.set(true);
  }

  submitStockAdjustment(): void {
    const part = this.selectedPart();
    if (!part || this.adjustQuantity <= 0 || this.resultingStock() < 0) return;

    this.submitting.set(true);
    const delta = this.adjustMode === 'ADD' ? this.adjustQuantity : -this.adjustQuantity;
    const dto: StockAdjustment = {
      quantityDelta: delta,
      reason: this.adjustReason.trim() || undefined
    };

    this.partService.adjustStock(part.id, dto).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.showAdjustModal.set(false);
        this.successMessage.set(res.message || 'Stock actualizado correctamente');
        this.loadAllData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al ajustar el stock');
      }
    });
  }

  // ── Modal Delete ──
  confirmDelete(part: Part): void {
    this.selectedPart.set(part);
    this.showDeleteModal.set(true);
  }

  submitDelete(): void {
    const part = this.selectedPart();
    if (!part) return;

    this.submitting.set(true);
    this.partService.delete(part.id).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.showDeleteModal.set(false);
        this.successMessage.set(res.message || 'Repuesto eliminado con éxito');
        this.loadAllData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al eliminar el repuesto');
      }
    });
  }
}
