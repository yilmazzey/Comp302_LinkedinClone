document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = ''; // Clear any previous errors
        
        const first_name = document.getElementById('firstName').value;
        const last_name = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ first_name, last_name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens if provided
                if (data.access_token) localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to profile management (same as login-to-dashboard)
                window.location.href = '/profile';
            } else {
                errorMessage.textContent = data.message || 'Registration failed. Please try again.';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred. Please try again later.';
            console.error('Registration error:', error);
        }
    });
}); 