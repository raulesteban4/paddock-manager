import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { UiService } from '../../../core/services/ui.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let uiService: UiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        UiService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    uiService = TestBed.inject(UiService);
    fixture.detectChanges();
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle collapse state in desktop mode', () => {
    expect(component.isCollapsed()).toBeFalse();
    component.toggleCollapse();
    expect(component.isCollapsed()).toBeTrue();
    component.toggleCollapse();
    expect(component.isCollapsed()).toBeFalse();
  });

  it('should close mobile sidebar on navigation click', () => {
    uiService.openMobileSidebar();
    expect(uiService.sidebarMobileOpen()).toBeTrue();

    component.onNavClick();
    expect(uiService.sidebarMobileOpen()).toBeFalse();
  });
});
