import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DiagnosisService } from '../../core/services/diagnosis.service';
import { RepairOrderService } from '../../core/services/repair-order.service';
import { DiagnosisResponseDto, DiagnosisRequestDto } from '../../core/models/diagnosis.model';
import { RepairOrder } from '../../core/models/repair-order.model';

@Component({
  selector: 'app-diagnoses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="diagnoses-container">

      <!-- ══ HEADER ════════════════════════════════════════════════════════════ -->
      <div class="page-header">
        <div class="header-info">
          <h1 class="page-title">🔍 Diagnósticos Técnicos</h1>
          <p class="page-subtitle">Registro y seguimiento de diagnósticos vinculados a órdenes de reparación</p>
        </div>
      </div>

      <!-- ══ BUSCAR DIAGNÓSTICO ════════════════════════════════════════════════ -->
      <div class="search-panel">
        <div class="search-row">
          <div class="search-field">
            <label>Buscar por Nº Orden (ej: ORD-2026-0001)</label>
            <div class="search-input-group">
              <input
                type="text"
                [(ngModel)]="orderNumberSearch"
                placeholder="ORD-2026-0001"
                class="form-control"
                (keyup.enter)="searchByOrderNumber()"
              />
              <button class="btn btn-primary" (click)="searchByOrderNumber()" [disabled]="loadingSearch()">
                {{ loadingSearch() ? '⏳ Buscando...' : '🔍 Buscar' }}
              </button>
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">{{ errorMessage() }}</div>
        }
      </div>

      <!-- ══ DIAGNÓSTICO ENCONTRADO ════════════════════════════════════════════ -->
      @if (currentDiagnosis()) {
        <div class="diagnosis-card">
          <div class="diagnosis-header">
            <div class="diagnosis-meta">
              <span class="order-badge">📋 {{ currentDiagnosis()!.orderNumber }}</span>
              <span class="mechanic-badge">🔧 {{ currentDiagnosis()!.mechanicName }}</span>
              <span class="date-info">{{ currentDiagnosis()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="diagnosis-actions">
              <button class="btn btn-secondary" (click)="openEditModal(currentDiagnosis()!)">✏️ Editar</button>
              <button class="btn btn-danger" (click)="confirmDelete(currentDiagnosis()!)">🗑️ Eliminar</button>
            </div>
          </div>

          <div class="diagnosis-sections">
            <div class="diagnosis-section">
              <h3 class="section-title">🩺 Síntomas</h3>
              <p class="section-text">{{ currentDiagnosis()!.symptoms }}</p>
            </div>

            <div class="diagnosis-section highlight">
              <h3 class="section-title">🔬 Diagnóstico Técnico</h3>
              <p class="section-text">{{ currentDiagnosis()!.diagnosis }}</p>
            </div>

            @if (currentDiagnosis()!.recommendations) {
              <div class="diagnosis-section">
                <h3 class="section-title">💡 Recomendaciones</h3>
                <p class="section-text">{{ currentDiagnosis()!.recommendations }}</p>
              </div>
            }

            @if (currentDiagnosis()!.observations) {
              <div class="diagnosis-section">
                <h3 class="section-title">📝 Observaciones</h3>
                <p class="section-text">{{ currentDiagnosis()!.observations }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══ ESTADO VACÍO ═══════════════════════════════════════════════════════ -->
      @if (!currentDiagnosis() && !loadingSearch()) {
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Busca un diagnóstico</h3>
          <p>Introduce el número de orden (ej: ORD-2026-0001) para consultar o editar su diagnóstico técnico.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">+ Nuevo Diagnóstico</button>
        </div>
      }

      @if (currentDiagnosis()) {
        <div class="fab-area">
          <button class="btn btn-primary btn-fab" (click)="openCreateModal()">+ Nuevo Diagnóstico</button>
        </div>
      }

    </div>

    <!-- ══ MODAL: CREAR / EDITAR ══════════════════════════════════════════════ -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? '✏️ Editar Diagnóstico' : '+ Nuevo Diagnóstico' }}</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="diagnosisForm" (ngSubmit)="submitForm()" class="modal-form">

            @if (!editingId()) {
              <div class="form-group">
                <label>ID de Orden de Reparación *</label>
                <input type="number" formControlName="repairOrderId" class="form-control"
                       placeholder="Introduce el ID de la orden" />
                @if (diagnosisForm.get('repairOrderId')?.invalid && diagnosisForm.get('repairOrderId')?.touched) {
                  <span class="error-text">El ID de la orden es obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label>ID Mecánico (opcional — se usará el asignado a la orden)</label>
                <input type="number" formControlName="mechanicId" class="form-control"
                       placeholder="Dejar vacío para usar el mecánico asignado a la OR" />
              </div>
            }

            <div class="form-group">
              <label>Síntomas observados *</label>
              <textarea formControlName="symptoms" class="form-control textarea-lg"
                        placeholder="Describe los síntomas observados y reportados por el cliente..."></textarea>
              @if (diagnosisForm.get('symptoms')?.invalid && diagnosisForm.get('symptoms')?.touched) {
                <span class="error-text">Los síntomas son obligatorios (mín. 5 caracteres)</span>
              }
            </div>

            <div class="form-group">
              <label>Diagnóstico técnico *</label>
              <textarea formControlName="diagnosis" class="form-control textarea-lg"
                        placeholder="Describe la avería diagnosticada con detalle técnico..."></textarea>
              @if (diagnosisForm.get('diagnosis')?.invalid && diagnosisForm.get('diagnosis')?.touched) {
                <span class="error-text">El diagnóstico es obligatorio (mín. 5 caracteres)</span>
              }
            </div>

            <div class="form-group">
              <label>Recomendaciones</label>
              <textarea formControlName="recommendations" class="form-control"
                        placeholder="Recomendaciones de reparación, sustitución de piezas, etc."></textarea>
            </div>

            <div class="form-group">
              <label>Observaciones adicionales</label>
              <textarea formControlName="observations" class="form-control"
                        placeholder="Otras observaciones sobre el estado general del vehículo..."></textarea>
            </div>

            @if (formError()) {
              <div class="alert alert-error">{{ formError() }}</div>
            }

            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="diagnosisForm.invalid || submitting()">
                {{ submitting() ? '⏳ Guardando...' : (editingId() ? '💾 Actualizar' : '✅ Crear Diagnóstico') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ══ MODAL: CONFIRMACIÓN ELIMINACIÓN ════════════════════════════════════ -->
    @if (showDeleteModal()) {
      <div class="modal-overlay" (click)="showDeleteModal.set(false)">
        <div class="modal-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🗑️ Confirmar eliminación</h2>
            <button class="modal-close" (click)="showDeleteModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de que quieres eliminar el diagnóstico de la orden <strong>{{ deletingDiagnosis()?.orderNumber }}</strong>?</p>
            <p class="warning-text">⚠️ Esta acción solo es posible si la orden está en estado <strong>DIAGNOSIS</strong> o <strong>QUOTE_PENDING</strong>.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="showDeleteModal.set(false)">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDelete()" [disabled]="submitting()">
              {{ submitting() ? '⏳ Eliminando...' : '🗑️ Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .diagnoses-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
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

    .search-panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .search-row { display: flex; gap: 1rem; }

    .search-field {
      flex: 1;

      label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.4rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .search-input-group {
      display: flex;
      gap: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.6rem 0.85rem;
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;

      &:focus { border-color: var(--accent-color); }
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .textarea-lg { min-height: 110px; }

    .diagnosis-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .diagnosis-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.02);
    }

    .diagnosis-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .order-badge {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .mechanic-badge {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .date-info {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .diagnosis-actions { display: flex; gap: 0.5rem; }

    .diagnosis-sections {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .diagnosis-section {
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;

      &.highlight {
        border-color: rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.04);
      }
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 0.5rem;
    }

    .section-text {
      font-size: 0.9rem;
      color: var(--text-primary);
      line-height: 1.6;
      margin: 0;
      white-space: pre-line;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; }

      h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      p { margin-bottom: 1.5rem; }
    }

    .fab-area {
      display: flex;
      justify-content: flex-end;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      white-space: nowrap;

      &:disabled { opacity: 0.5; cursor: not-allowed; }

      &.btn-primary {
        background: var(--accent-color);
        color: #fff;
        &:hover:not(:disabled) { filter: brightness(1.1); }
      }

      &.btn-secondary {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        &:hover:not(:disabled) { background: rgba(99, 102, 241, 0.25); }
      }

      &.btn-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); }
      }

      &.btn-ghost {
        background: transparent;
        color: var(--text-secondary);
        &:hover:not(:disabled) { background: rgba(255,255,255,0.05); }
      }

      &.btn-fab { padding: 0.6rem 1.25rem; }
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 0.75rem;

      &.alert-error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
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

    .modal-panel.modal-sm { max-width: 420px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      &:hover { color: var(--text-primary); }
    }

    .modal-form, .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-body { gap: 0.75rem; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    }

    .error-text {
      font-size: 0.78rem;
      color: #ef4444;
    }

    .warning-text {
      font-size: 0.85rem;
      color: #f59e0b;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class DiagnosesComponent implements OnInit {
  private readonly diagnosisService = inject(DiagnosisService);
  private readonly fb = inject(FormBuilder);

  // ── State ─────────────────────────────────────────────────────────────────
  orderNumberSearch = '';
  currentDiagnosis = signal<DiagnosisResponseDto | null>(null);
  loadingSearch = signal(false);
  errorMessage = signal('');

  showModal = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);
  formError = signal('');

  showDeleteModal = signal(false);
  deletingDiagnosis = signal<DiagnosisResponseDto | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  diagnosisForm: FormGroup = this.fb.group({
    repairOrderId: [null, Validators.required],
    mechanicId: [null],
    symptoms: ['', [Validators.required, Validators.minLength(5)]],
    diagnosis: ['', [Validators.required, Validators.minLength(5)]],
    recommendations: [''],
    observations: ['']
  });

  ngOnInit(): void {}

  // ── Search ────────────────────────────────────────────────────────────────
  searchByOrderNumber(): void {
    const q = this.orderNumberSearch.trim();
    if (!q) return;

    this.loadingSearch.set(true);
    this.errorMessage.set('');
    this.currentDiagnosis.set(null);

    this.diagnosisService.getByOrderNumber(q).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentDiagnosis.set(res.data);
        }
        this.loadingSearch.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'No se encontró diagnóstico para esta orden. Puedes crear uno nuevo.'
        );
        this.loadingSearch.set(false);
      }
    });
  }

  // ── Modal Create ──────────────────────────────────────────────────────────
  openCreateModal(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.diagnosisForm.reset();
    this.diagnosisForm.get('repairOrderId')?.enable();
    this.diagnosisForm.get('mechanicId')?.enable();
    this.showModal.set(true);
  }

  // ── Modal Edit ────────────────────────────────────────────────────────────
  openEditModal(d: DiagnosisResponseDto): void {
    this.editingId.set(d.id);
    this.formError.set('');
    this.diagnosisForm.patchValue({
      repairOrderId: d.repairOrderId,
      mechanicId: d.mechanicId,
      symptoms: d.symptoms,
      diagnosis: d.diagnosis,
      recommendations: d.recommendations ?? '',
      observations: d.observations ?? ''
    });
    this.diagnosisForm.get('repairOrderId')?.disable();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.diagnosisForm.reset();
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submitForm(): void {
    if (this.diagnosisForm.invalid) {
      this.diagnosisForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.formError.set('');

    const raw = this.diagnosisForm.getRawValue();
    const dto: DiagnosisRequestDto = {
      repairOrderId: raw.repairOrderId,
      mechanicId: raw.mechanicId || null,
      symptoms: raw.symptoms,
      diagnosis: raw.diagnosis,
      recommendations: raw.recommendations || undefined,
      observations: raw.observations || undefined
    };

    const id = this.editingId();
    const obs$ = id
      ? this.diagnosisService.update(id, dto)
      : this.diagnosisService.create(dto);

    obs$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentDiagnosis.set(res.data);
          this.orderNumberSearch = res.data.orderNumber;
        }
        this.submitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.formError.set(err?.error?.message || 'Error al guardar el diagnóstico');
        this.submitting.set(false);
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(d: DiagnosisResponseDto): void {
    this.deletingDiagnosis.set(d);
    this.showDeleteModal.set(true);
  }

  executeDelete(): void {
    const d = this.deletingDiagnosis();
    if (!d) return;

    this.submitting.set(true);
    this.diagnosisService.delete(d.id).subscribe({
      next: () => {
        this.currentDiagnosis.set(null);
        this.orderNumberSearch = '';
        this.submitting.set(false);
        this.showDeleteModal.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'No se pudo eliminar el diagnóstico');
        this.submitting.set(false);
        this.showDeleteModal.set(false);
      }
    });
  }
}

