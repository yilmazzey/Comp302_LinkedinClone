document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    
    // Fetch latest user data from backend and update form/localStorage
    async function fetchAndFillProfile() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('user', JSON.stringify(user));
                fillForm(user);
            } else {
                // fallback to localStorage
                const user = JSON.parse(localStorage.getItem('user')) || {};
                fillForm(user);
            }
        } catch (err) {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            fillForm(user);
        }
    }

    function fillForm(user) {
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
        if (typeof experience === 'string') {
            try { experience = JSON.parse(experience); } catch (e) { experience = []; }
        }
        if (!Array.isArray(experience)) experience = [];
        experience.forEach(exp => addExperienceItem(exp));
        // Education
        const educationList = document.getElementById('educationList');
        educationList.innerHTML = '';
        let education = user.education;
        if (typeof education === 'string') {
            try { education = JSON.parse(education); } catch (e) { education = []; }
        }
        if (!Array.isArray(education)) education = [];
        education.forEach(edu => addEducationItem(edu));
    }

    fetchAndFillProfile();

    // Initialize experience and education sections
    const experienceList = document.getElementById('experienceList');
    const educationList = document.getElementById('educationList');

    // Add event listeners for adding new items
    document.getElementById('addExperienceBtn').addEventListener('click', () => {
        addExperienceItem();
    });

    document.getElementById('addEducationBtn').addEventListener('click', () => {
        addEducationItem();
    });

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect all form data
        const formData = new FormData();
        formData.append('first_name', document.getElementById('firstName').value);
        formData.append('last_name', document.getElementById('lastName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('job_title', document.getElementById('title').value);
        formData.append('location', document.getElementById('location').value);
        formData.append('bio', document.getElementById('bio').value);
        formData.append('experience', JSON.stringify(collectExperienceData()));
        formData.append('education', JSON.stringify(collectEducationData()));
        const profileImageInput = document.getElementById('profileImage');
        if (profileImageInput && profileImageInput.files.length > 0) {
            formData.append('profile_image', profileImageInput.files[0]);
        }
        // Add error message display
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
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Profile updated successfully!');
                window.location.href = '/userprofile';
            } else {
                errorDiv.textContent = data.message || 'Failed to update profile.';
                errorDiv.style.display = 'block';
                console.error('Profile update error:', data);
            }
        } catch (err) {
            errorDiv.textContent = 'An error occurred while updating your profile.';
            errorDiv.style.display = 'block';
            console.error('Profile update JS error:', err);
        }
    });
});

function addExperienceItem(data = {}) {
    const experienceList = document.getElementById('experienceList');
    const div = document.createElement('div');
    div.className = 'experience-item';
    div.innerHTML = `
        <div class="mb-2">
            <label class="form-label">Role</label>
            <input type="text" class="form-control" value="${data.role || ''}" placeholder="e.g., Software Engineer">
        </div>
        <div class="mb-2">
            <label class="form-label">Company</label>
            <input type="text" class="form-control" value="${data.company || ''}" placeholder="e.g., Tech Corp">
        </div>
        <div class="mb-2">
            <label class="form-label">Years</label>
            <input type="text" class="form-control" value="${data.years || ''}" placeholder="e.g., 2020 - Present">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
    `;
    experienceList.appendChild(div);
}

function addEducationItem(data = {}) {
    const educationList = document.getElementById('educationList');
    const div = document.createElement('div');
    div.className = 'education-item';
    div.innerHTML = `
        <div class="mb-2">
            <label class="form-label">School</label>
            <input type="text" class="form-control" value="${data.school || ''}" placeholder="e.g., University of Technology">
        </div>
        <div class="mb-2">
            <label class="form-label">Degree</label>
            <input type="text" class="form-control" value="${data.degree || ''}" placeholder="e.g., Bachelor of Science in Computer Science">
        </div>
        <div class="mb-2">
            <label class="form-label">Years</label>
            <input type="text" class="form-control" value="${data.years || ''}" placeholder="e.g., 2016 - 2020">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
    `;
    educationList.appendChild(div);
}

function collectExperienceData() {
    const experienceItems = document.querySelectorAll('.experience-item');
    return Array.from(experienceItems).map(item => {
        const inputs = item.querySelectorAll('input');
        return {
            role: inputs[0].value,
            company: inputs[1].value,
            years: inputs[2].value
        };
    });
}

function collectEducationData() {
    const educationItems = document.querySelectorAll('.education-item');
    return Array.from(educationItems).map(item => {
        const inputs = item.querySelectorAll('input');
        return {
            school: inputs[0].value,
            degree: inputs[1].value,
            years: inputs[2].value
        };
    });
}
