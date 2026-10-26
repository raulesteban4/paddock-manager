import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional HTTP de Angular 18.
 * Agrega el token JWT 'Bearer <token>' a todas las peticiones salientes
 * y captura respuestas 401 para cerrar sesión automáticamente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let modifiedReq = req;
  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        console.warn('Respuesta 401 Unauthorized detectada. Redirigiendo a inicio de sesión...');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};

