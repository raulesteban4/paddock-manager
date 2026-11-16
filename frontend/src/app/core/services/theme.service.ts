import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'paddock_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly theme = signal<Theme>(this.getInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Aplicar el tema inicial inmediatamente al DOM
    this.applyTheme(this.theme());

    // Effect reactivo para sincronizar cualquier cambio de señal con el DOM y localStorage
    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, current);
      } catch (e) {
        // En caso de que el almacenamiento local esté deshabilitado
      }
    });
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // Ignorar errores de acceso
    }
  }

  private getInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (e) {
      // Ignorar errores de acceso
    }

    // Comprobar preferencia del sistema operativo
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        root.classList.add('dark-theme');
        document.body?.classList.add('dark-theme');
      } else {
        root.classList.remove('dark-theme');
        document.body?.classList.remove('dark-theme');
      }
    }
  }
}
