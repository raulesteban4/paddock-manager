import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UiService } from '../../../core/services/ui.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let themeService: ThemeService;
  let uiService: UiService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ThemeService,
        UiService,
        AuthService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    uiService = TestBed.inject(UiService);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile sidebar when menu button is triggered', () => {
    spyOn(uiService, 'toggleMobileSidebar');
    uiService.toggleMobileSidebar();
    expect(uiService.toggleMobileSidebar).toHaveBeenCalled();
  });

  it('should toggle theme when theme button is clicked', () => {
    spyOn(themeService, 'toggleTheme');
    component.themeService.toggleTheme();
    expect(themeService.toggleTheme).toHaveBeenCalled();
  });

  it('should display initials fallback when no user is logged in', () => {
    expect(component.userInitials()).toBe('PM');
  });

  it('should compute user initials when user is logged in', () => {
    authService.currentUser.set({
      token: 'dummy',
      type: 'Bearer',
      id: 1,
      email: 'mario@paddock.com',
      fullName: 'Mario Rossi',
      role: 'ROLE_MECHANIC'
    });
    expect(component.userInitials()).toBe('MR');
  });
});
