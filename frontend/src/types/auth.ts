export interface AuthResponse {
    refresh: string;
    access: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}
