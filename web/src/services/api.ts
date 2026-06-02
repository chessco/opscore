import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3005`, // dynamically point to the host IP instead of localhost
});

api.interceptors.request.use((config) => {
    const state = useAuthStore.getState() as any;
    if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }
    if (state.user?.tenantId) {
        config.headers['X-Tenant-ID'] = state.user.tenantId;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
