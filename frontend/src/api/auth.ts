import api from './client';
import type { LoginCredentials, AuthResponse } from '../types/auth';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/token/', credentials);
    return response.data;
};

export const resendVerification = async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/resend-verification/', { email });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
};
