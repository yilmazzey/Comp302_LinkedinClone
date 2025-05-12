document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    
    // Get current user data from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {
        first_name: '',
        last_name: '',
        email: '',
        title: '',
        location: '',
        bio: '',
        experience: [],
        education: []
    };

    // Pre-fill form with user data
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('title').value = user.title || '';
    document.getElementById('location').value = user.location || '';
    document.getElementById('bio').value = user.bio || '';

    // Initialize experience and education sections
    const experienceList = document.getElementById('experienceList');
    const educationList = document.getElementById('educationList');

    // Render existing experience
    if (user.experience && user.experience.length > 0) {
        user.experience.forEach(exp => addExperienceItem(exp));
    }

    // Render existing education
    if (user.education && user.education.length > 0) {
        user.education.forEach(edu => addEducationItem(edu));
    }

    // Add event listeners for adding new items
    document.getElementById('addExperienceBtn').addEventListener('click', () => {
        addExperienceItem();
    });

    document.getElementById('addEducationBtn').addEventListener('click', () => {
        addEducationItem();
    });

    // Handle form submission
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect all form data
        const formData = {
            ...user, // preserve any extra fields
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            title: document.getElementById('title').value,
            location: document.getElementById('location').value,
            bio: document.getElementById('bio').value,
            experience: collectExperienceData(),
            education: collectEducationData()
        };

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(formData));
        alert('Profile updated successfully!');
        window.location.href = '/userprofile';
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
