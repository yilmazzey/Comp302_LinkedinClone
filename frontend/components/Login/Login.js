import api from '../../utils/axios';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
        window.location.href = '/components/Dashboard/Dashboard.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            // Store both tokens
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            
            // Store user data if provided
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            // Redirect to dashboard
            window.location.href = '/components/Dashboard/Dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.response?.data?.message || 'Login failed. Please try again.';
            console.error('Login error:', error);
        }
    });
}); 