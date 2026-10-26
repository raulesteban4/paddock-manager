import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../core/services/vehicle.service';
import { CustomerService } from '../../core/services/customer.service';
import { Vehicle, VehicleRequest, FuelType } from '../../core/models/vehicle.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="vehicles-page">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div class="title-group">
          <h1>Parque de Vehículos</h1>
          <p>Catálogo de automóviles recepcionados, control de kilometraje y vinculación con clientes.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+</span> Registrar Vehículo
        </button>
      </div>

      <!-- Alertas de Estado -->
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

      <!-- Barra de Filtros y Búsqueda -->
      <div class="card search-card">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (keyup.enter)="onSearch()"
            placeholder="Buscar por matrícula, bastidor (VIN), marca, modelo o cliente..." 
            class="search-input" />
          @if (searchQuery) {
            <button class="btn-clear" (click)="clearSearch()">Limpiar</button>
          }
          <button class="btn btn-secondary" (click)="onSearch()">Buscar</button>
        </div>
      </div>

      <!-- Tabla Principal de Vehículos -->
      <div class="card table-card">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando vehículos desde el taller...</p>
          </div>
        } @else if (vehicles().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🚗</span>
            <h3>No se encontraron vehículos</h3>
            <p>{{ searchQuery ? 'No hay vehículos que coincidan con la búsqueda.' : 'Aún no hay vehículos registrados en el taller.' }}</p>
            @if (!searchQuery) {
              <button class="btn btn-primary" (click)="openCreateModal()">Registrar Primer Vehículo</button>
            }
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Vehículo</th>
                  <th>Nº Bastidor (VIN)</th>
                  <th>Combustible</th>
                  <th>Kilómetros</th>
                  <th>Propietario</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (v of vehicles(); track v.id) {
                  <tr>
                    <td>
                      <span class="plate-badge">{{ v.licensePlate }}</span>
                    </td>
                    <td>
                      <div class="car-title-group">
                        <strong>{{ v.brand }} {{ v.model }}</strong>
                        <small>{{ v.year }} • {{ v.engine || 'Motor Estándar' }}</small>
                      </div>
                    </td>
                    <td>
                      <span class="vin-code">{{ v.vin }}</span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getFuelBadgeClass(v.fuelType)">
                        {{ v.fuelType }}
                      </span>
                    </td>
                    <td>
                      <span class="mileage-val">{{ v.mileage | number }} km</span>
                    </td>
                    <td>
                      <div class="owner-group">
                        <span class="owner-name">{{ v.customerName }}</span>
                        <span class="owner-dni">{{ v.customerDni }}</span>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-action delete" (click)="confirmDelete(v)" title="Eliminar vehículo">
                        🗑️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginador -->
          <div class="pagination-footer">
            <span class="pagination-info">
              Página {{ currentPage() + 1 }} de {{ totalPages() || 1 }} (Total: {{ totalElements() }} vehículos)
            </span>
            <div class="pagination-controls">
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="currentPage() === 0 || isLoading()" 
                (click)="goToPage(currentPage() - 1)">
                ← Anterior
              </button>
              <button 
                class="btn btn-secondary btn-sm" 
                [disabled]="currentPage() >= totalPages() - 1 || isLoading()" 
                (click)="goToPage(currentPage() + 1)">
                Siguiente →
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modal de Registro de Vehículo -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Registrar Vehículo en Taller</h3>
              <button class="btn-close" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="vehicleForm" (ngSubmit)="onSubmitVehicle()">
              <div class="modal-body">
                <!-- Cliente Propietario -->
                <div class="form-group">
                  <label for="customerId">Cliente Propietario *</label>
                  <select id="customerId" formControlName="customerId">
                    <option [ngValue]="null" disabled>-- Selecciona un cliente registrado --</option>
                    @for (cust of availableCustomers(); track cust.id) {
                      <option [ngValue]="cust.id">
                        {{ cust.fullName }} ({{ cust.dniCif }})
                      </option>
                    }
                  </select>
                  @if (isFieldInvalid('customerId')) {
                    <span class="field-error">Debes asignar un cliente propietario.</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="licensePlate">Matrícula *</label>
                    <input id="licensePlate" type="text" formControlName="licensePlate" placeholder="1234ABC" />
                    @if (isFieldInvalid('licensePlate')) {
                      <span class="field-error">La matrícula es obligatoria.</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="vin">Nº de Bastidor (VIN) *</label>
                    <input id="vin" type="text" formControlName="vin" placeholder="17 caracteres alfanuméricos" />
                    @if (isFieldInvalid('vin')) {
                      <span class="field-error">El bastidor (VIN) debe tener exactamente 17 caracteres.</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="brand">Marca *</label>
                    <input id="brand" type="text" formControlName="brand" placeholder="Volkswagen" />
                    @if (isFieldInvalid('brand')) {
                      <span class="field-error">La marca es obligatoria.</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="model">Modelo *</label>
                    <input id="model" type="text" formControlName="model" placeholder="Golf 2.0 TDI" />
                    @if (isFieldInvalid('model')) {
                      <span class="field-error">El modelo es obligatorio.</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="year">Año *</label>
                    <input id="year" type="number" formControlName="year" placeholder="2020" />
                    @if (isFieldInvalid('year')) {
                      <span class="field-error">Año válido requerido (1900-2100).</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="fuelType">Combustible *</label>
                    <select id="fuelType" formControlName="fuelType">
                      <option value="DIESEL">Diésel</option>
                      <option value="GASOLINE">Gasolina</option>
                      <option value="HYBRID">Híbrido</option>
                      <option value="ELECTRIC">Eléctrico</option>
                      <option value="LPG">GLP / Gas</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="mileage">Kilómetros Actuales *</label>
                    <input id="mileage" type="number" formControlName="mileage" placeholder="85000" />
                    @if (isFieldInvalid('mileage')) {
                      <span class="field-error">Kilometraje no negativo obligatorio.</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="engine">Motorización / Cilindrada</label>
                    <input id="engine" type="text" formControlName="engine" placeholder="2.0 TDI 150cv" />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="vehicleForm.invalid || isSaving()">
                  {{ isSaving() ? 'Guardando...' : 'Guardar Vehículo' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vehicles-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 500;

      &.alert-danger {
        background: var(--danger-bg);
        color: var(--danger);
        border: 1px solid var(--danger-border);
      }

      &.alert-success {
        background: var(--success-bg);
        color: var(--success);
        border: 1px solid var(--success-border);
      }

      .close-alert {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: inherit;
      }
    }

    .search-card {
      padding: 0.85rem 1.25rem;

      .search-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .search-icon {
          font-size: 1.1rem;
          color: var(--text-muted);
        }

        .search-input {
          flex: 1;
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          outline: none;

          &:focus {
            border-color: var(--primary);
          }
        }

        .btn-clear {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          text-decoration: underline;
        }
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;

      th {
        background: #f8fafc;
        padding: 0.85rem 1.25rem;
        color: var(--text-muted);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--card-border);
      }

      td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-main);
        vertical-align: middle;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }

    .plate-badge {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      background: #ffffff;
      border: 2px solid #0f172a;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .car-title-group {
      display: flex;
      flex-direction: column;
      strong { color: var(--text-main); font-weight: 600; }
      small { color: var(--text-muted); font-size: 0.78rem; }
    }

    .vin-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: var(--text-muted);
      letter-spacing: 0.025em;
    }

    .mileage-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #334155;
    }

    .owner-group {
      display: flex;
      flex-direction: column;
      .owner-name { font-weight: 600; font-size: 0.85rem; }
      .owner-dni { font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    }

    .btn-action {
      background: none;
      border: 1px solid var(--card-border);
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover.delete {
        background: #fee2e2;
        border-color: #fca5a5;
      }
    }

    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--card-border);
      background: #fafafa;

      .pagination-info {
        font-size: 0.825rem;
        color: var(--text-muted);
      }

      .pagination-controls {
        display: flex;
        gap: 0.5rem;
      }

      .btn-sm {
        padding: 0.35rem 0.75rem;
        font-size: 0.8rem;
      }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3.5rem 1rem;

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e2e8f0;
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1rem;
      }

      .empty-icon {
        font-size: 2.75rem;
        margin-bottom: 0.75rem;
        display: inline-block;
      }

      h3 {
        font-size: 1.15rem;
        color: var(--text-main);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-muted);
        font-size: 0.875rem;
        max-width: 420px;
        margin: 0 auto 1.25rem;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-md);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-main);
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-muted);
        cursor: pointer;
        line-height: 1;
      }
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;

      .form-group {
        flex: 1;
        min-width: 220px;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-main);
      }

      input, select {
        border: 1px solid var(--card-border);
        border-radius: var(--radius-sm);
        padding: 0.6rem 0.85rem;
        font-size: 0.875rem;
        outline: none;
        background: #ffffff;

        &:focus {
          border-color: var(--primary);
        }
      }

      .field-error {
        color: var(--danger);
        font-size: 0.72rem;
        font-weight: 500;
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--card-border);
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class VehiclesComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(FormBuilder);

  vehicles = signal<Vehicle[]>([]);
  availableCustomers = signal<Customer[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showModal = signal<boolean>(false);

  // Paginación y búsqueda
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  searchQuery = '';

  vehicleForm: FormGroup = this.fb.group({
    customerId: [null, [Validators.required]],
    licensePlate: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
    vin: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]],
    brand: ['', [Validators.required, Validators.maxLength(100)]],
    model: ['', [Validators.required, Validators.maxLength(100)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
    fuelType: ['DIESEL', [Validators.required]],
    engine: ['', [Validators.maxLength(100)]],
    mileage: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadVehicles();
    this.loadAvailableCustomers();
  }

  loadVehicles(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.vehicleService.getVehicles(this.searchQuery, this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.vehicles.set(response.data.content);
          this.totalPages.set(response.data.totalPages);
          this.totalElements.set(response.data.totalElements);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al conectar con la API de vehículos.');
          this.isLoading.set(false);
        }
      });
  }

  loadAvailableCustomers(): void {
    this.customerService.getCustomers('', 0, 100).subscribe({
      next: (res) => {
        this.availableCustomers.set(res.data.content);
      },
      error: () => {
        // Silencioso; si falla, el select estará vacío
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadVehicles();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.loadVehicles();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadVehicles();
    }
  }

  openCreateModal(): void {
    this.vehicleForm.reset({
      customerId: null,
      year: new Date().getFullYear(),
      fuelType: 'DIESEL',
      mileage: 0
    });
    this.loadAvailableCustomers();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.vehicleForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vehicleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFuelBadgeClass(fuelType: FuelType): string {
    switch (fuelType) {
      case 'GASOLINE': return 'badge-success';
      case 'DIESEL': return 'badge-warning';
      case 'ELECTRIC': return 'badge-info';
      case 'HYBRID': return 'badge-info';
      case 'LPG': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  onSubmitVehicle(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const request: VehicleRequest = this.vehicleForm.value;

    this.vehicleService.createVehicle(request).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeModal();
        this.successMessage.set(`Vehículo con matrícula '${res.data.licensePlate}' registrado exitosamente.`);
        this.loadVehicles();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar el vehículo.');
      }
    });
  }

  confirmDelete(vehicle: Vehicle): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})?`)) {
      this.vehicleService.deleteVehicle(vehicle.id).subscribe({
        next: () => {
          this.successMessage.set(`Vehículo ${vehicle.licensePlate} eliminado.`);
          this.loadVehicles();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'No se pudo eliminar el vehículo.');
        }
      });
    }
  }
}