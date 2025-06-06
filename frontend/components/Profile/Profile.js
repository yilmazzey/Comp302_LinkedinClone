console.log('Profile.js script loaded'); // Initial load check

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded event fired'); // Check if event fires
    
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) {
        console.error('Profile form not found!');
        return;
    }
    console.log('Profile form found');
    
    // Fetch latest user data from backend and update form/localStorage
    async function fetchAndFillProfile() {
        console.log('Fetching profile data...'); // Debug log
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.error('No access token found!');
                return;
            }
            console.log('Making API request to /api/profile');
            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const user = await response.json();
                console.log('Fetched user data:', user);
                localStorage.setItem('user', JSON.stringify(user));
                fillForm(user);
            } else {
                console.error('Failed to fetch profile:', response.status);
                // fallback to localStorage
                const user = JSON.parse(localStorage.getItem('user')) || {};
                fillForm(user);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            const user = JSON.parse(localStorage.getItem('user')) || {};
            fillForm(user);
        }
    }

    function fillForm(user) {
        console.log('Filling form with user data:', user);
        
        // Check if all required elements exist
        const requiredElements = [
            'firstName', 'lastName', 'email', 'title', 
            'location', 'bio', 'experienceList', 'educationList'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('Missing form elements:', missingElements);
            return;
        }
        
        // Basic info
        document.getElementById('firstName').value = user.first_name || '';
        document.getElementById('lastName').value = user.last_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('title').value = user.job_title || '';
        document.getElementById('location').value = user.location || '';
        document.getElementById('bio').value = user.bio || '';
        
        // Experience
        const experienceList = document.getElementById('experienceList');
        experienceList.innerHTML = '';
        let experience = user.experience;
        console.log('Raw experience data:', experience);
        
        if (typeof experience === 'string') {
            try { 
                experience = JSON.parse(experience);
                console.log('Parsed experience:', experience);
            } catch (e) { 
                console.error('Error parsing experience:', e);
                experience = []; 
            }
        }
        if (!Array.isArray(experience)) experience = [];
        experience.forEach(exp => {
            console.log('Adding experience item:', exp);
            addExperienceItem(exp);
        });
        
        // Education
        const educationList = document.getElementById('educationList');
        educationList.innerHTML = '';
        let education = user.education;
        console.log('Raw education data:', education);
        
        if (typeof education === 'string') {
            try { 
                education = JSON.parse(education);
                console.log('Parsed education:', education);
            } catch (e) { 
                console.error('Error parsing education:', e);
                education = []; 
            }
        }
        if (!Array.isArray(education)) education = [];
        education.forEach(edu => {
            console.log('Adding education item:', edu);
            addEducationItem(edu);
        });

        // Connection count
        console.log('connections_count:', user.connections_count, typeof user.connections_count);
        const count = (user.connections_count !== undefined && user.connections_count !== null)
            ? user.connections_count
            : 0;
        if (document.getElementById('connectionCount')) {
            document.getElementById('connectionCount').textContent = count;
        }
    }

    // Check if add buttons exist
    const addExperienceBtn = document.getElementById('addExperienceBtn');
    const addEducationBtn = document.getElementById('addEducationBtn');
    
    if (!addExperienceBtn || !addEducationBtn) {
        console.error('Add buttons not found!');
        return;
    }

    // Add event listeners for adding new items
    addExperienceBtn.addEventListener('click', () => {
        console.log('Add Experience button clicked');
        addExperienceItem();
    });

    addEducationBtn.addEventListener('click', () => {
        console.log('Add Education button clicked');
        addEducationItem();
    });

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No access token found');
            }

            // Create a FormData object to send multipart/form-data
            const formData = new FormData();
            formData.append('first_name', document.getElementById('firstName').value);
            formData.append('last_name', document.getElementById('lastName').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('job_title', document.getElementById('title').value);
            formData.append('location', document.getElementById('location').value);
            formData.append('bio', document.getElementById('bio').value);
            formData.append('experience', JSON.stringify(collectExperienceData()));
            formData.append('education', JSON.stringify(collectEducationData()));

            // Handle profile image
            const profileImageInput = document.getElementById('profileImage');
            if (profileImageInput && profileImageInput.files.length > 0) {
                formData.append('profile_image', profileImageInput.files[0]);
            }

            let errorDiv = document.getElementById('profileError');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'profileError';
                errorDiv.className = 'alert alert-danger';
                errorDiv.style.display = 'none';
                profileForm.prepend(errorDiv);
            }
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            console.log('Sending profile update request');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            console.log('Update response status:', response.status);
            const data = await response.json();
            console.log('Profile update response:', data);
            
            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Profile updated successfully!');
                // Redirect to the user's profile page
                window.location.href = '/userprofile';
            } else {
                errorDiv.textContent = data.message || 'Failed to update profile.';
                errorDiv.style.display = 'block';
                console.error('Profile update error:', data);
            }
        } catch (err) {
            console.error('Error preparing form data:', err);
            alert('An error occurred while preparing the form data.');
        }
    });

    // Initial fetch
    console.log('Starting initial profile fetch');
    fetchAndFillProfile();
});

function collectExperienceData() {
    const experienceItems = document.querySelectorAll('.experience-item');
    return Array.from(experienceItems).map(item => {
        const inputs = item.querySelectorAll('input, textarea');
        if (inputs.length < 6) {
            console.error('Missing inputs in experience item');
            return null;
        }
        return {
            title: inputs[0].value || '',
            company: inputs[1].value || '',
            location: inputs[2].value || '',
            start_date: inputs[3].value || '',
            end_date: inputs[4].value || '',
            description: inputs[5].value || ''
        };
    }).filter(item => item !== null);
}

function collectEducationData() {
    const educationItems = document.querySelectorAll('.education-item');
    return Array.from(educationItems).map(item => {
        const inputs = item.querySelectorAll('input');
        if (inputs.length < 5) {
            console.error('Missing inputs in education item');
            return null;
        }
        return {
            school: inputs[0].value || '',
            degree: inputs[1].value || '',
            field: inputs[2].value || '',
            start_date: inputs[3].value || '',
            end_date: inputs[4].value || ''
        };
    }).filter(item => item !== null);
}

function addExperienceItem(data = {}) {
    console.log('Adding experience item:', data);
    const experienceList = document.getElementById('experienceList');
    if (!experienceList) {
        console.error('Experience list element not found!');
        return;
    }
    const div = document.createElement('div');
    div.className = 'experience-item mb-3 p-3 border rounded';
    div.innerHTML = `
        <div class="mb-2">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" value="${data.title || ''}" placeholder="e.g., Software Engineer">
        </div>
        <div class="mb-2">
            <label class="form-label">Company</label>
            <input type="text" class="form-control" value="${data.company || ''}" placeholder="e.g., Tech Corp">
        </div>
        <div class="mb-2">
            <label class="form-label">Location</label>
            <input type="text" class="form-control" value="${data.location || ''}" placeholder="e.g., New York">
        </div>
        <div class="mb-2">
            <label class="form-label">Start Date</label>
            <input type="month" class="form-control" value="${data.start_date || ''}">
        </div>
        <div class="mb-2">
            <label class="form-label">End Date</label>
            <input type="month" class="form-control" value="${data.end_date || ''}" placeholder="Present">
        </div>
        <div class="mb-2">
            <label class="form-label">Description</label>
            <textarea class="form-control" placeholder="Describe your responsibilities and achievements">${data.description || ''}</textarea>
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
    `;
    experienceList.appendChild(div);
}

function addEducationItem(data = {}) {
    console.log('Adding education item:', data);
    const educationList = document.getElementById('educationList');
    if (!educationList) {
        console.error('Education list element not found!');
        return;
    }
    const div = document.createElement('div');
    div.className = 'education-item mb-3 p-3 border rounded';
    div.innerHTML = `
        <div class="mb-2">
            <label class="form-label">School</label>
            <input type="text" class="form-control" value="${data.school || ''}" placeholder="e.g., University of Technology">
        </div>
        <div class="mb-2">
            <label class="form-label">Degree</label>
            <input type="text" class="form-control" value="${data.degree || ''}" placeholder="e.g., Bachelor's Degree">
        </div>
        <div class="mb-2">
            <label class="form-label">Field of Study</label>
            <input type="text" class="form-control" value="${data.field || ''}" placeholder="e.g., Computer Science">
        </div>
        <div class="mb-2">
            <label class="form-label">Start Date</label>
            <input type="month" class="form-control" value="${data.start_date || ''}">
        </div>
        <div class="mb-2">
            <label class="form-label">End Date</label>
            <input type="month" class="form-control" value="${data.end_date || ''}" placeholder="Present">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
    `;
    educationList.appendChild(div);
}