import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="title-group">
          <h1>Órdenes de Reparación</h1>
          <p>Seguimiento técnico del flujo de trabajo: diagnosis, presupuestos y mano de obra.</p>
        </div>
        <button class="btn btn-primary">+ Nueva Orden</button>
      </div>

      <div class="card">
        <div class="placeholder-content">
          <span class="icon">🔧</span>
          <h3>Módulo de Órdenes Preparado</h3>
          <p>Se integrará en la Fase 10 con trazabilidad completa de estados técnicos y asignación a mecánicos.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-content {
      text-align: center;
      padding: 3rem 1rem;
      .icon { font-size: 3rem; margin-bottom: 1rem; display: inline-block; }
      h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
      p { color: var(--text-muted); max-width: 500px; margin: 0 auto; font-size: 0.9rem; line-height: 1.5; }
    }
  `]
})
export class RepairOrdersComponent {}