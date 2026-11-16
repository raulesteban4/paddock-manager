import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UiService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <!-- Botón Menú Hamburguesa para Móvil -->
        <button 
          type="button" 
          class="mobile-menu-btn" 
          (click)="uiService.toggleMobileSidebar()" 
          aria-label="Abrir menú de navegación"
          title="Menú">
          <span class="hamburger-icon">☰</span>
        </button>

        <div class="workshop-badge">
          <span class="icon">🏁</span>
          <span class="name">Paddock Taller Central</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Fecha del día -->
        <div class="date-chip">
          <span>📅</span>
          <span>{{ today | date:'EEEE, d MMMM y' }}</span>
        </div>

        <!-- Botón Selector de Tema (Modo Oscuro / Claro) -->
        <button 
          type="button" 
          class="theme-toggle-btn" 
          (click)="themeService.toggleTheme()" 
          [attr.aria-label]="themeService.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'"
          [title]="themeService.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <span class="theme-icon">{{ themeService.isDark() ? '☀️' : '🌙' }}</span>
        </button>

        <!-- Perfil de Usuario -->
        <div class="user-profile">
          <div class="avatar">{{ userInitials() }}</div>
          <div class="user-info">
            <span class="user-name">{{ currentUser()?.fullName || 'Usuario' }}</span>
            <span class="user-role">{{ roleDisplay() }}</span>
          </div>

          <button 
            type="button" 
            class="logout-btn" 
            (click)="logout()" 
            aria-label="Cerrar sesión"
            title="Cerrar sesión">
            <span class="logout-icon">🚪</span>
            <span class="logout-label">Salir</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 64px;
      background: var(--card-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 40;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: 1px solid var(--card-border);
      color: var(--text-main);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 1.15rem;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-app);
      }

      @media (max-width: 768px) {
        display: flex;
      }
    }

    .workshop-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-app);
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-main);
      border: 1px solid var(--card-border);

      @media (max-width: 480px) {
        .name {
          display: none;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .date-chip {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: capitalize;

      @media (max-width: 850px) {
        display: none;
      }
    }

    .theme-toggle-btn {
      background: var(--bg-app);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.2s ease;

      &:hover {
        background: var(--card-border);
        transform: rotate(15deg);
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 0.85rem;
      border-left: 1px solid var(--card-border);

      .avatar {
        width: 36px;
        height: 36px;
        background: var(--primary);
        color: #ffffff;
        font-weight: 700;
        font-size: 0.85rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
        }

        .user-role {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.05em;
        }

        @media (max-width: 580px) {
          display: none;
        }
      }

      .logout-btn {
        margin-left: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--danger-bg);
        border: 1px solid var(--danger-border);
        color: var(--danger);
        padding: 0.35rem 0.65rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--danger);
          color: #ffffff;
        }

        .logout-label {
          @media (max-width: 480px) {
            display: none;
          }
        }
      }
    }
  `]
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly uiService = inject(UiService);

  readonly today = new Date();
  readonly currentUser = this.authService.currentUser;

  readonly userInitials = computed(() => {
    const name = this.currentUser()?.fullName?.trim();
    if (!name) return 'PM';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  readonly roleDisplay = computed(() => {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'ROLE_ADMIN':
        return 'ADMINISTRADOR';
      case 'ROLE_RECEPTIONIST':
        return 'RECEPCIÓN';
      case 'ROLE_MECHANIC':
        return 'MECÁNICO';
      default:
        return role ? role.replace('ROLE_', '') : 'TALLER';
    }
  });

  logout(): void {
    if (confirm('¿Deseas cerrar la sesión de Paddock Manager?')) {
      this.authService.logout();
    }
  }
}
