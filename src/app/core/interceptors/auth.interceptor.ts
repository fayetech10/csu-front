import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Don't intercept auth endpoints (login, register, etc.)
    if (req.url.includes('/api/auth/')) {
        return next(req);
    }

    // Proactive check: if token is expired, logout immediately before sending
    if (authService.isTokenExpired()) {
        authService.logout('expired');
        return throwError(() => new Error('Token expired'));
    }

    // Attach token
    const token = authService.getToken();
    const request = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            // Backend returned 401 Unauthorized → token invalid/expired
            if (error.status === 401) {
                authService.logout('expired');
            }
            return throwError(() => error);
        })
    );
};
