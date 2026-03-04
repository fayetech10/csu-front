import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, User } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = 'http://localhost:8080/api/auth';
    private readonly TOKEN_KEY = 'sencsu_token';
    private readonly USER_KEY = 'sencsu_user';

    isLoggedIn = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
    currentUser = signal<User | null>(this.getStoredUser());

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: AuthRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                this.setSession(response);
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.isLoggedIn.set(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private setSession(authResult: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, authResult.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
        this.currentUser.set(authResult.user);
        this.isLoggedIn.set(true);
    }

    private getStoredUser(): User | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }
}
