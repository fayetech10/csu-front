import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    error = '';
    sessionExpired = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        });
    }

    ngOnInit(): void {
        // Check if redirected due to expired session
        this.route.queryParams.subscribe(params => {
            if (params['reason'] === 'expired') {
                this.sessionExpired = true;
                // Auto-hide after 8 seconds
                setTimeout(() => this.sessionExpired = false, 8000);
            }
        });
    }

    onSubmit(): void {
        console.log('Login attempt started:', this.loginForm.value);
        if (this.loginForm.invalid) {
            console.warn('Form is invalid:', this.loginForm.errors);
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = '';
        this.sessionExpired = false;

        this.authService.login(this.loginForm.value).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                console.error('Login error:', err);
                if (err.status === 0) {
                    this.error = 'Impossible de contacter le serveur. Vérifiez votre connexion ou l\'URL ngrok.';
                } else if (err.status === 401 || err.status === 403) {
                    this.error = 'Identifiants invalides. Veuillez réessayer.';
                } else {
                    this.error = 'Une erreur est survenue lors de la connexion.';
                }
                this.loading = false;
            }
        });
    }
}
