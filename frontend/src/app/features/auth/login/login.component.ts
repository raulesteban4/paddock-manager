import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface DemoUser {
  roleName: string;
  badge: string;
  email: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Logo & Brand Header -->
        <div class="brand-header">
          <div class="brand-icon-wrapper">
            <span class="brand-icon">🏎️</span>
          </div>
          <h1 class="brand-title">PADDOCK <span class="accent">MANAGER</span></h1>
          <p class="brand-subtitle">Control de Taller Mecánico & Gestión Integral</p>
        </div>

        <!-- Feedback Alert -->
        @if (errorMessage()) {
          <div class="alert-error" role="alert">
            <span class="alert-icon">⚠️</span>
            <div class="alert-text">{{ errorMessage() }}</div>
          </div>
        }

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ejemplo@paddock.com"
                autocomplete="username"
                [class.invalid]="isFieldInvalid('email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
              <span class="field-error">Ingresa un correo electrónico válido</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
                [class.invalid]="isFieldInvalid('password')"
              />
              <button 
                type="button" 
                class="password-toggle" 
                (click)="toggleShowPassword()" 
                [title]="showPassword() ? 'Ocultar' : 'Mostrar'">
                {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <span class="field-error">La contraseña es obligatoria</span>
            }
          </div>

          <button 
            type="submit" 
            class="btn-submit" 
            [disabled]="loginForm.invalid || isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Iniciando sesión...</span>
            } @else {
              <span>Acceder al Taller</span>
              <span class="arrow-icon">→</span>
            }
          </button>
        </form>

        <!-- Demo Accounts Section (Portfolio Feature) -->
        <div class="demo-section">
          <div class="demo-divider">
            <span>Acceso rápido de demostración</span>
          </div>

          <div class="demo-grid">
            @for (user of demoUsers; track user.email) {
              <button 
                type="button" 
                class="demo-card" 
                (click)="applyDemoUser(user)"
                [disabled]="isLoading()">
                <div class="demo-card-header">
                  <span class="demo-icon">{{ user.icon }}</span>
                  <span class="demo-badge" [class]="user.badge">{{ user.roleName }}</span>
                </div>
                <div class="demo-email">{{ user.email }}</div>
                <div class="demo-desc">{{ user.description }}</div>
              </button>
            }
          </div>
          <p class="demo-note">Contraseña predeterminada de prueba: <code>password123</code></p>
        </div>

        <div class="footer-legal">
          <span>Paddock Manager v1.0.0 &bull; Java 17 + Spring Boot 3 &bull; Angular 18</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 20%, #1e293b 0%, #090d16 100%);
      font-family: inherit;
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 2.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      color: #f3f4f6;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 2rem;

      .brand-icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: rgba(220, 38, 38, 0.15);
        border: 2px solid rgba(220, 38, 38, 0.4);
        border-radius: 50%;
        margin-bottom: 0.85rem;

        .brand-icon {
          font-size: 1.85rem;
        }
      }

      .brand-title {
        font-size: 1.65rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        margin: 0;
        color: #ffffff;

        .accent {
          color: #dc2626;
        }
      }

      .brand-subtitle {
        font-size: 0.825rem;
        color: #94a3b8;
        margin-top: 0.35rem;
        margin-bottom: 0;
      }
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.85rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      animation: fadeIn 0.2s ease-in;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        font-size: 0.825rem;
        font-weight: 600;
        color: #cbd5e1;
      }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 0.9rem;
        font-size: 1rem;
        color: #64748b;
        pointer-events: none;
      }

      input {
        width: 100%;
        padding: 0.75rem 2.6rem 0.75rem 2.6rem;
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 0.5rem;
        color: #ffffff;
        font-size: 0.9rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
          background: #1e293b;
        }

        &.invalid {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        &::placeholder {
          color: #64748b;
        }
      }

      .password-toggle {
        position: absolute;
        right: 0.75rem;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        font-size: 0.9rem;
        opacity: 0.7;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }
      }
    }

    .field-error {
      font-size: 0.75rem;
      color: #f87171;
    }

    .btn-submit {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1.5rem;
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);

      &:hover:not(:disabled) {
        background: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(220, 38, 38, 0.5);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .arrow-icon {
        font-size: 1.1rem;
        transition: transform 0.2s;
      }

      &:hover:not(:disabled) .arrow-icon {
        transform: translateX(4px);
      }
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Demo Section */
    .demo-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .demo-divider {
      text-align: center;
      margin-bottom: 1rem;

      span {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.85rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .demo-card {
      background: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.5rem;
      padding: 0.75rem 0.5rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &:hover:not(:disabled) {
        background: #273549;
        border-color: #dc2626;
        transform: translateY(-2px);
      }

      .demo-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.2rem;
      }

      .demo-icon {
        font-size: 1.1rem;
      }

      .demo-badge {
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
        text-transform: uppercase;

        &.badge-admin {
          background: rgba(220, 38, 38, 0.2);
          color: #f87171;
        }

        &.badge-reception {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        &.badge-mechanic {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }
      }

      .demo-email {
        font-size: 0.7rem;
        font-weight: 600;
        color: #f3f4f6;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .demo-desc {
        font-size: 0.65rem;
        color: #94a3b8;
      }
    }

    .demo-note {
      text-align: center;
      font-size: 0.72rem;
      color: #94a3b8;
      margin: 0;

      code {
        background: #1f2937;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        color: #fca5a5;
        font-family: monospace;
      }
    }

    .footer-legal {
      margin-top: 1.75rem;
      text-align: center;
      font-size: 0.68rem;
      color: #64748b;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly demoUsers: DemoUser[] = [
    {
      roleName: 'Admin',
      badge: 'badge-admin',
      email: 'admin@paddock.com',
      description: 'Acceso Total',
      icon: '👑'
    },
    {
      roleName: 'Recepción',
      badge: 'badge-reception',
      email: 'recepcion@paddock.com',
      description: 'Citas & Clientes',
      icon: '📋'
    },
    {
      roleName: 'Mecánico',
      badge: 'badge-mechanic',
      email: 'mecanico1@paddock.com',
      description: 'Taller & Órdenes',
      icon: '🔧'
    }
  ];

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleShowPassword(): void {
    this.showPassword.update(val => !val);
  }

  applyDemoUser(demo: DemoUser): void {
    this.loginForm.patchValue({
      email: demo.email,
      password: 'password123'
    });
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || 'Error de conexión con el servidor. Verifica que el backend esté activo.';
        this.errorMessage.set(errorMsg);
      }
    });
  }
}

