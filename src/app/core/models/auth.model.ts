export interface User {
    id: number;
    prenoms: string;
    nom: string;
    telephone: string;
    email: string;
    role: string;
    photo?: string;
}

export interface AuthRequest {
    email: string; // This is the identifier (WhatsApp/Email)
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}
