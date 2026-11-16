import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created with initial theme', () => {
    expect(service).toBeTruthy();
    expect(['light', 'dark']).toContain(service.theme());
  });

  it('should toggle theme from light to dark and back', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBeFalse();

    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBeTrue();

    service.toggleTheme();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBeFalse();
  });

  it('should explicitly set theme and persist to localStorage', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBeTrue();
    expect(localStorage.getItem('paddock_theme')).toBe('dark');

    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBeFalse();
    expect(localStorage.getItem('paddock_theme')).toBe('light');
  });

  it('should update DOM data-theme attribute', () => {
    service.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
