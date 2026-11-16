import { TestBed } from '@angular/core/testing';
import { UiService } from './ui.service';

describe('UiService', () => {
  let service: UiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UiService]
    });
    service = TestBed.inject(UiService);
  });

  it('should be created with sidebar closed by default', () => {
    expect(service).toBeTruthy();
    expect(service.sidebarMobileOpen()).toBeFalse();
  });

  it('should toggle mobile sidebar state', () => {
    service.toggleMobileSidebar();
    expect(service.sidebarMobileOpen()).toBeTrue();

    service.toggleMobileSidebar();
    expect(service.sidebarMobileOpen()).toBeFalse();
  });

  it('should open and close mobile sidebar explicitly', () => {
    service.openMobileSidebar();
    expect(service.sidebarMobileOpen()).toBeTrue();

    service.closeMobileSidebar();
    expect(service.sidebarMobileOpen()).toBeFalse();
  });
});
