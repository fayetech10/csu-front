import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check both token existence AND expiry
    if (authService.hasValidToken()) {
        return true;
    }

    // Token missing or expired → logout cleanly and redirect
    if (authService.getToken() && authService.isTokenExpired()) {
        // Token exists but expired → show expired message
        authService.logout('expired');
        return false;
    }

    // No token at all → just redirect to login
    return router.createUrlTree(['/login']);
};
