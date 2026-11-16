import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  readonly sidebarMobileOpen = signal<boolean>(false);

  toggleMobileSidebar(): void {
    this.sidebarMobileOpen.update(open => !open);
  }

  openMobileSidebar(): void {
    this.sidebarMobileOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.sidebarMobileOpen.set(false);
  }
}
