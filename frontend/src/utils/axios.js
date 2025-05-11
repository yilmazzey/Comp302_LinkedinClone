import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post('http://localhost:5000/api/auth/refresh', {
                    refresh_token: refreshToken
                });

                // Update tokens
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);

                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh token fails, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api; 