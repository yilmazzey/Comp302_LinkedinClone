document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token in localStorage
                localStorage.setItem('token', data.token);
                // Redirect to home page
                window.location.href = '/';
            } else {
                errorMessage.textContent = data.message || 'Registration failed. Please try again.';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred. Please try again later.';
            console.error('Registration error:', error);
        }
    });
}); 