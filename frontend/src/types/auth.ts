export interface User {
    id: number;
    email: string;
    name: string | null;
    last_name: string | null;
}

export interface AuthResponse {
    refresh: string;
    access: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

