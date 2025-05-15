document.addEventListener('DOMContentLoaded', async () => {
    // Add back button functionality
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', () => {
        // Go back to the previous page (search results)
        window.history.back();
    });

    // Get user ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        alert('No user ID provided');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch user data using the new endpoint
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch user data');
        }

        const user = result.data;

        // Update profile information
        document.getElementById('profilePhoto').src = user.profile_photo || '/static/uploads/default-profile.png';
        document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('jobTitle').textContent = user.job_title || '';
        document.getElementById('location').textContent = user.location || '';
        document.getElementById('bio').textContent = user.bio || 'No bio available';

        // Parse and display experience
        const experienceList = document.getElementById('experienceList');
        if (user.experience) {
            try {
                const experiences = JSON.parse(user.experience);
                experienceList.innerHTML = experiences.map(exp => `
                    <div class="mb-3">
                        <h6 class="mb-1">${exp.title}</h6>
                        <p class="text-muted mb-1">${exp.company} - ${exp.location}</p>
                        <p class="text-muted mb-1">${exp.start_date} - ${exp.end_date}</p>
                        <p class="mb-0">${exp.description || ''}</p>
                    </div>
                `).join('');
            } catch (e) {
                experienceList.innerHTML = '<p class="text-muted">No experience information available</p>';
            }
        } else {
            experienceList.innerHTML = '<p class="text-muted">No experience information available</p>';
        }

        // Parse and display education
        const educationList = document.getElementById('educationList');
        if (user.education) {
            try {
                const educations = JSON.parse(user.education);
                educationList.innerHTML = educations.map(edu => `
                    <div class="mb-3">
                        <h6 class="mb-1">${edu.school}</h6>
                        <p class="text-muted mb-1">${edu.degree} in ${edu.field}</p>
                        <p class="text-muted mb-0">${edu.start_date} - ${edu.end_date}</p>
                    </div>
                `).join('');
            } catch (e) {
                educationList.innerHTML = '<p class="text-muted">No education information available</p>';
            }
        } else {
            educationList.innerHTML = '<p class="text-muted">No education information available</p>';
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load user profile. Please try again.');
    }
}); 