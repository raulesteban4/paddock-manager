import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">🏎️</div>
          @if (!isCollapsed()) {
            <div class="brand-text">
              <span class="brand-title">PADDOCK</span>
              <span class="brand-subtitle">MANAGER</span>
            </div>
          }
        </div>
        <button class="toggle-btn" (click)="toggleCollapse()" title="Colapsar menú">
          {{ isCollapsed() ? '→' : '←' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          @for (item of navItems; track item.route) {
            <li class="nav-item">
              <a [routerLink]="item.route" 
                 routerLinkActive="active" 
                 [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                 class="nav-link"
                 [title]="item.label">
                <span class="nav-icon">{{ item.icon }}</span>
                @if (!isCollapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="nav-badge">{{ item.badge }}</span>
                  }
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-footer">
        @if (!isCollapsed()) {
          <div class="system-status">
            <span class="status-dot"></span>
            <span class="status-text">Taller Conectado</span>
          </div>
          <div class="version">v1.0.0</div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: sticky;
      top: 0;
      z-index: 50;

      &.collapsed {
        width: 72px;

        .sidebar-header {
          justify-content: center;
        }

        .nav-link {
          justify-content: center;
          padding: 0.75rem 0;
        }
      }
    }

    .sidebar-header {
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .brand-icon {
        font-size: 1.5rem;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;

        .brand-title {
          font-weight: 800;
          font-size: 1.05rem;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .brand-subtitle {
          font-weight: 700;
          font-size: 0.68rem;
          color: var(--primary);
          letter-spacing: 0.15em;
        }
      }
    }

    .toggle-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--sidebar-text);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: var(--sidebar-hover);
        color: #ffffff;
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.5rem;
      overflow-y: auto;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.7rem 0.85rem;
      border-radius: var(--radius-sm);
      color: var(--sidebar-text);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.885rem;
      transition: all 0.15s ease-in-out;

      &:hover {
        background: var(--sidebar-hover);
        color: #ffffff;
      }

      &.active {
        background: var(--primary);
        color: #ffffff;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);

        .nav-badge {
          background: #ffffff;
          color: var(--primary);
        }
      }
    }

    .nav-icon {
      font-size: 1.15rem;
      min-width: 1.25rem;
      text-align: center;
    }

    .nav-label {
      flex: 1;
      white-space: nowrap;
    }

    .nav-badge {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .system-status {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        .status-text {
          font-size: 0.72rem;
          color: var(--sidebar-text);
        }
      }

      .version {
        font-size: 0.72rem;
        color: var(--sidebar-text);
        font-family: 'JetBrains Mono', monospace;
      }
    }
  `]
})
export class SidebarComponent {
  isCollapsed = signal<boolean>(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Clientes', route: '/customers', icon: '👥' },
    { label: 'Vehículos', route: '/vehicles', icon: '🚗' },
    { label: 'Citas', route: '/appointments', icon: '📅' },
    { label: 'Órdenes de Trabajo', route: '/repair-orders', icon: '🔧', badge: '3' },
    { label: 'Inventario & Piezas', route: '/inventory', icon: '📦' }
  ];

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
  }
}