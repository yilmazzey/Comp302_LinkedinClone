document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/login';
        return;
    }

    // Pre-fill form with user data
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/auth/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update local storage with new user data
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Profile updated successfully!');
                // Redirect back to profile page
                window.location.href = '/components/Profile/Profile.html';
            } else {
                alert(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('An error occurred while updating your profile');
        }
    });
});
