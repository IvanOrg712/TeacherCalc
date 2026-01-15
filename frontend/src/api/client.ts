import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh (basic implementation)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Implement token refresh logic here later if needed
        if (error.response?.status === 401) {
            // Clear token and maybe redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
        return Promise.reject(error);
    }
);

export default api;
