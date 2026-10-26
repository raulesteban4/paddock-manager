import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { Customer, CustomerRequest } from '../../core/models/customer.model';
import { Page } from '../../core/models/api-response.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="customers-page">
      <!-- Encabezado de Página -->
      <div class="page-header">
        <div class="title-group">
          <h1>Directorio de Clientes</h1>
          <p>Gestión integral de clientes, datos de contacto y vinculación con vehículos.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+</span> Nuevo Cliente
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
            placeholder="Buscar por DNI/CIF, nombre, apellidos, email o teléfono..." 
            class="search-input" />
          @if (searchQuery) {
            <button class="btn-clear" (click)="clearSearch()">Limpiar</button>
          }
          <button class="btn btn-secondary" (click)="onSearch()">Buscar</button>
        </div>
      </div>

      <!-- Tabla Principal de Clientes -->
      <div class="card table-card">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando clientes desde el servidor...</p>
          </div>
        } @else if (customers().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">👥</span>
            <h3>No se encontraron clientes</h3>
            <p>{{ searchQuery ? 'No hay coincidencias con la búsqueda realizada.' : 'Aún no hay clientes registrados en el sistema.' }}</p>
            @if (!searchQuery) {
              <button class="btn btn-primary" (click)="openCreateModal()">Registrar Primer Cliente</button>
            }
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>DNI / CIF</th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Ubicación</th>
                  <th>Fecha Alta</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (c of customers(); track c.id) {
                  <tr>
                    <td>
                      <span class="id-badge">{{ c.dniCif }}</span>
                    </td>
                    <td>
                      <div class="customer-name-group">
                        <strong>{{ c.fullName }}</strong>
                      </div>
                    </td>
                    <td>
                      <div class="contact-group">
                        <span class="email">✉️ {{ c.email }}</span>
                        <span class="phone">📞 {{ c.phone }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="city">{{ c.city || 'No especificada' }}</span>
                    </td>
                    <td class="date-cell">
                      {{ c.createdAt | date:'dd/MM/yyyy' }}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-action delete" (click)="confirmDelete(c)" title="Eliminar cliente">
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
              Página {{ currentPage() + 1 }} de {{ totalPages() || 1 }} (Total: {{ totalElements() }} clientes)
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

      <!-- Modal de Creación de Cliente -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Alta de Nuevo Cliente</h3>
              <button class="btn-close" (click)="closeModal()">×</button>
            </div>

            <form [formGroup]="customerForm" (ngSubmit)="onSubmitCustomer()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="dniCif">DNI / CIF *</label>
                    <input id="dniCif" type="text" formControlName="dniCif" placeholder="12345678Z" />
                    @if (isFieldInvalid('dniCif')) {
                      <span class="field-error">El DNI/CIF es obligatorio (mínimo 5 caracteres).</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="phone">Teléfono Móvil *</label>
                    <input id="phone" type="text" formControlName="phone" placeholder="600111222" />
                    @if (isFieldInvalid('phone')) {
                      <span class="field-error">Teléfono obligatorio (9 a 20 dígitos).</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName">Nombre *</label>
                    <input id="firstName" type="text" formControlName="firstName" placeholder="Carlos" />
                    @if (isFieldInvalid('firstName')) {
                      <span class="field-error">El nombre es obligatorio.</span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="lastName">Apellidos *</label>
                    <input id="lastName" type="text" formControlName="lastName" placeholder="Sainz Vázquez" />
                    @if (isFieldInvalid('lastName')) {
                      <span class="field-error">Los apellidos son obligatorios.</span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">Correo Electrónico *</label>
                  <input id="email" type="email" formControlName="email" placeholder="carlos@paddock.com" />
                  @if (isFieldInvalid('email')) {
                    <span class="field-error">Introduce un correo electrónico válido.</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group" style="flex: 2;">
                    <label for="address">Dirección Postal</label>
                    <input id="address" type="text" formControlName="address" placeholder="Av. de la Gran Vía 25" />
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label for="city">Ciudad</label>
                    <input id="city" type="text" formControlName="city" placeholder="Madrid" />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || isSaving()">
                  {{ isSaving() ? 'Guardando...' : 'Crear Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .customers-page {
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
          transition: border-color 0.15s;

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

    .id-badge {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      font-size: 0.825rem;
      background: #e2e8f0;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: #334155;
    }

    .customer-name-group {
      font-weight: 600;
      color: var(--text-main);
    }

    .contact-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.8rem;

      .email { color: var(--text-muted); }
      .phone { color: #334155; font-weight: 500; font-family: 'JetBrains Mono', monospace; }
    }

    .city {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .date-cell {
      font-size: 0.8rem;
      color: var(--text-muted);
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
      max-width: 560px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
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
        min-width: 200px;
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

      input {
        border: 1px solid var(--card-border);
        border-radius: var(--radius-sm);
        padding: 0.6rem 0.85rem;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.15s;

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
export class CustomersComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(FormBuilder);

  customers = signal<Customer[]>([]);
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

  customerForm: FormGroup = this.fb.group({
    dniCif: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9\s-]{9,20}$/)]],
    address: ['', [Validators.maxLength(255)]],
    city: ['', [Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.getCustomers(this.searchQuery, this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.customers.set(response.data.content);
          this.totalPages.set(response.data.totalPages);
          this.totalElements.set(response.data.totalElements);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al conectar con la API de clientes.');
          this.isLoading.set(false);
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadCustomers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.loadCustomers();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadCustomers();
    }
  }

  openCreateModal(): void {
    this.customerForm.reset();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.customerForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.customerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmitCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const request: CustomerRequest = this.customerForm.value;

    this.customerService.createCustomer(request).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeModal();
        this.successMessage.set(`Cliente '${res.data.fullName}' registrado exitosamente.`);
        this.loadCustomers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar el cliente.');
      }
    });
  }

  confirmDelete(customer: Customer): void {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente ${customer.fullName}?`)) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.successMessage.set(`Cliente ${customer.fullName} eliminado.`);
          this.loadCustomers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'No se pudo eliminar el cliente.');
        }
      });
    }
  }
}