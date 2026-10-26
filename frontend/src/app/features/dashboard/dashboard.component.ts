import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div class="title-group">
          <h1>Panel de Control del Taller</h1>
          <p>Visión general en tiempo real de operaciones, recepciones y mecánicos.</p>
        </div>
        <div class="actions-group">
          <a routerLink="/customers" class="btn btn-secondary">+ Nuevo Cliente</a>
          <a routerLink="/vehicles" class="btn btn-secondary">+ Nuevo Vehículo</a>
          <a routerLink="/repair-orders" class="btn btn-primary">+ Nueva Orden de Trabajo</a>
        </div>
      </div>

      <!-- Métricas Clave -->
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-icon" style="background: rgba(220, 38, 38, 0.1); color: #dc2626;">🏎️</div>
          <div class="stat-content">
            <span class="stat-label">Vehículos en Taller</span>
            <span class="stat-value">12</span>
            <span class="stat-trend positive">↑ 3 ingresados hoy</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon" style="background: rgba(2, 132, 199, 0.1); color: #0284c7;">🔧</div>
          <div class="stat-content">
            <span class="stat-label">Órdenes Activas</span>
            <span class="stat-value">8</span>
            <span class="stat-trend">5 en reparación, 3 diagnosis</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon" style="background: rgba(22, 163, 74, 0.1); color: #16a34a;">📅</div>
          <div class="stat-content">
            <span class="stat-label">Citas Programadas Hoy</span>
            <span class="stat-value">4</span>
            <span class="stat-trend positive">2 completadas</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon" style="background: rgba(217, 119, 6, 0.1); color: #d97706;">⚠️</div>
          <div class="stat-content">
            <span class="stat-label">Stock de Piezas Bajo</span>
            <span class="stat-value">2</span>
            <span class="stat-trend danger">Requieren reposición</span>
          </div>
        </div>
      </div>

      <!-- Resumen Operativo -->
      <div class="content-grid">
        <div class="card main-table-card">
          <div class="card-header">
            <h3>Órdenes de Trabajo en Curso</h3>
            <a routerLink="/repair-orders" class="view-all">Ver todas →</a>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Mecánico</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="order-id">ORD-2026-0001</td>
                  <td><strong>BMW 320d</strong> (5678DEF)</td>
                  <td>Juan Pérez López</td>
                  <td>Carlos Mecánico</td>
                  <td><span class="priority-badge high">ALTA</span></td>
                  <td><span class="badge badge-warning">EN REPARACIÓN</span></td>
                </tr>
                <tr>
                  <td class="order-id">ORD-2026-0002</td>
                  <td><strong>Volkswagen Golf</strong> (1234ABC)</td>
                  <td>Marta Fernández</td>
                  <td>David Martínez</td>
                  <td><span class="priority-badge medium">MEDIA</span></td>
                  <td><span class="badge badge-info">DIAGNÓSTICO</span></td>
                </tr>
                <tr>
                  <td class="order-id">ORD-2026-0003</td>
                  <td><strong>Renault Megane</strong> (9012GHI)</td>
                  <td>Carlos Sainz</td>
                  <td>Carlos Mecánico</td>
                  <td><span class="priority-badge urgent">URGENTE</span></td>
                  <td><span class="badge badge-success">COMPLETADA</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card side-panel-card">
          <div class="card-header">
            <h3>Atajos Rápidos</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/customers" class="quick-link-item">
              <span class="icon">👥</span>
              <div class="link-info">
                <strong>Directorio de Clientes</strong>
                <small>Buscar por DNI, teléfono o email</small>
              </div>
            </a>
            <a routerLink="/vehicles" class="quick-link-item">
              <span class="icon">🚗</span>
              <div class="link-info">
                <strong>Parque de Vehículos</strong>
                <small>Búsqueda directa por matrícula o VIN</small>
              </div>
            </a>
            <a routerLink="/inventory" class="quick-link-item">
              <span class="icon">📦</span>
              <div class="link-info">
                <strong>Control de Inventario</strong>
                <small>Consultar stock de filtros, aceites y frenos</small>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .actions-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;

      .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .stat-content {
        display: flex;
        flex-direction: column;

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.2;
        }

        .stat-trend {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 0.2rem;

          &.positive { color: var(--success); font-weight: 600; }
          &.danger { color: var(--danger); font-weight: 600; }
        }
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--card-border);

      h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-main);
      }

      .view-all {
        font-size: 0.825rem;
        font-weight: 600;
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;

      th {
        padding: 0.75rem 0.5rem;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--card-border);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      td {
        padding: 0.85rem 0.5rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-main);
      }

      .order-id {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        color: var(--text-muted);
      }

      .priority-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;

        &.high { background: #fee2e2; color: #b91c1c; }
        &.medium { background: #fef3c7; color: #b45309; }
        &.urgent { background: #ef4444; color: #ffffff; }
      }
    }

    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quick-link-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--card-border);
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;

      &:hover {
        background: var(--bg-app);
        border-color: #cbd5e1;
        transform: translateX(4px);
      }

      .icon {
        font-size: 1.5rem;
      }

      .link-info {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 0.85rem;
          color: var(--text-main);
        }

        small {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      }
    }
  `]
})
export class DashboardComponent {}