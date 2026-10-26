import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, LoginRequest } from '../models/auth.model';

const TOKEN_KEY = 'paddock_auth_token';
const USER_KEY = 'paddock_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Signals reactivos para el estado de autenticación global
  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<AuthResponse | null>(this.getStoredUser());

  // Señales calculadas (derivadas)
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ROLE_ADMIN');
  readonly isReceptionist = computed(() => this.currentUser()?.role === 'ROLE_RECEPTIONIST');
  readonly isMechanic = computed(() => this.currentUser()?.role === 'ROLE_MECHANIC');

  /**
   * Inicia sesión contra el backend de Spring Boot con JWT
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  /**
   * Consulta el usuario autenticado actual desde el backend para verificar validez del token
   */
  fetchCurrentUser(): Observable<ApiResponse<AuthResponse>> {
    return this.http.get<ApiResponse<AuthResponse>>(`${this.baseUrl}/me`).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const current = this.currentUser();
          if (current) {
            const updated: AuthResponse = {
              ...current,
              fullName: response.data.fullName,
              role: response.data.role,
              email: response.data.email
            };
            this.setSession(updated);
          }
        }
      })
    );
  }

  /**
   * Cierra la sesión activa, borra tokens y redirige al login
   */
  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('No se pudo acceder a localStorage', e);
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Guarda los datos de autenticación en almacenamiento local y en los signals
   */
  private setSession(authData: AuthResponse): void {
    try {
      if (authData.token) {
        localStorage.setItem(TOKEN_KEY, authData.token);
        this.token.set(authData.token);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(authData));
      this.currentUser.set(authData);
    } catch (e) {
      console.warn('Error guardando sesión en localStorage', e);
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): AuthResponse | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

