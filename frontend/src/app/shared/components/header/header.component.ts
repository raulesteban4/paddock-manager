import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <div class="workshop-badge">
          <span class="icon">🏁</span>
          <span class="name">Paddock Taller Central</span>
        </div>
      </div>

      <div class="header-right">
        <div class="date-chip">
          <span>📅</span>
          <span>{{ today | date:'EEEE, d MMMM y' }}</span>
        </div>

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
      background: #ffffff;
      border-bottom: 1px solid var(--card-border);
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 40;
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
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .date-chip {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: capitalize;

      @media (max-width: 640px) {
        display: none;
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 1rem;
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
      }

      .logout-btn {
        margin-left: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: #fef2f2;
        border: 1px solid #fee2e2;
        color: #dc2626;
        padding: 0.35rem 0.65rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
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