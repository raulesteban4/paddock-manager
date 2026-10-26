import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-layout">
        <app-sidebar></app-sidebar>
        
        <div class="main-wrapper">
          <app-header></app-header>
          
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background-color: var(--bg-app);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0; // Previene desbordamiento horizontal con flexbox
    }

    .page-content {
      flex: 1;
      padding: 1.75rem 2rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }
  `]
})
export class AppComponent {
  readonly authService = inject(AuthService);
  title = 'Paddock Manager';
}