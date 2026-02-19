import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

const API = axios.create({
    baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
});

export const getBackendOrigin = () => {
    const base = API.defaults.baseURL || '';
    return base.replace(/\/api\/?$/, '');
};

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (err) => Promise.reject(err));

API.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message;

        console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${err.config?.url}:`, {
            status,
            message: errorMessage,
            data: err.response?.data
        });

        if (status === 401 && !err.config?.url?.includes('token/')) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            window.dispatchEvent(new Event('auth:logout'));
        }

        // Attach standardized info to the original error object
        err.message = errorMessage;
        err.status = status;

        return Promise.reject(err);
    }
);

export default API;