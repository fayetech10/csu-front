import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = `https://backprod-6s6p.onrender.com/api/auth`;
    private readonly TOKEN_KEY = environment.tokenKey;
    private readonly USER_KEY = environment.userKey;
    private readonly EXPIRES_AT_KEY = 'sencsu_token_expires_at';

    isLoggedIn = signal<boolean>(this.hasValidToken());
    currentUser = signal<User | null>(this.getStoredUser());

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: AuthRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                this.setSession(response);
            })
        );
    }

    logout(reason?: string): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.EXPIRES_AT_KEY);
        this.currentUser.set(null);
        this.isLoggedIn.set(false);

        if (reason === 'expired') {
            this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
        } else {
            this.router.navigate(['/login']);
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /** Check if the stored token is expired */
    isTokenExpired(): boolean {
        const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
        if (!expiresAt) {
            // No expiry stored — treat as expired if no token exists
            return !this.getToken();
        }
        // Add 10-second buffer to avoid edge-case race conditions
        return Date.now() >= (parseInt(expiresAt, 10) - 10000);
    }

    /** Check if user has a valid (existing + non-expired) token */
    hasValidToken(): boolean {
        const token = this.getToken();
        if (!token) return false;
        return !this.isTokenExpired();
    }

    private setSession(authResult: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));

        // Store expiry timestamp: current time + expiresIn (seconds → milliseconds)
        if (authResult.expiresIn) {
            const expiresAt = Date.now() + authResult.expiresIn * 1000;
            localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
        }

        this.currentUser.set(authResult.user);
        this.isLoggedIn.set(true);
    }

    private getStoredUser(): User | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }
}
