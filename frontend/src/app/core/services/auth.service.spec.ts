import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: AuthResponse = {
    token: 'jwt-test-token-12345',
    type: 'Bearer',
    id: 1,
    email: 'admin@paddock.com',
    fullName: 'Admin Paddock',
    role: 'ROLE_ADMIN'
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created in unauthenticated state when localStorage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.userRole()).toBeNull();
    expect(service.isAdmin()).toBeFalse();
  });

  it('should authenticate user and set reactive signals on successful login', () => {
    const loginRequest: LoginRequest = { email: 'admin@paddock.com', password: 'password123' };
    const apiResponse: ApiResponse<AuthResponse> = {
      success: true,
      data: mockUser,
      message: 'Inicio de sesión exitoso',
      timestamp: new Date().toISOString()
    };

    service.login(loginRequest).subscribe(response => {
      expect(response.success).toBeTrue();
      expect(response.data?.email).toBe('admin@paddock.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(apiResponse);

    expect(service.token()).toBe('jwt-test-token-12345');
    expect(service.currentUser()?.fullName).toBe('Admin Paddock');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.userRole()).toBe('ROLE_ADMIN');
    expect(service.isAdmin()).toBeTrue();
    expect(service.isReceptionist()).toBeFalse();
    expect(service.isMechanic()).toBeFalse();
    expect(localStorage.getItem('paddock_auth_token')).toBe('jwt-test-token-12345');
  });

  it('should clear signals, localStorage and navigate to /login on logout', () => {
    // Simular sesión iniciada
    service.token.set('some-token');
    service.currentUser.set(mockUser);
    localStorage.setItem('paddock_auth_token', 'some-token');
    localStorage.setItem('paddock_auth_user', JSON.stringify(mockUser));

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('paddock_auth_token')).toBeNull();
    expect(localStorage.getItem('paddock_auth_user')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should properly compute role flags for receptionist and mechanic', () => {
    const receptionistUser: AuthResponse = { ...mockUser, role: 'ROLE_RECEPTIONIST' };
    service.currentUser.set(receptionistUser);
    expect(service.isAdmin()).toBeFalse();
    expect(service.isReceptionist()).toBeTrue();
    expect(service.isMechanic()).toBeFalse();

    const mechanicUser: AuthResponse = { ...mockUser, role: 'ROLE_MECHANIC' };
    service.currentUser.set(mechanicUser);
    expect(service.isAdmin()).toBeFalse();
    expect(service.isReceptionist()).toBeFalse();
    expect(service.isMechanic()).toBeTrue();
  });
});
