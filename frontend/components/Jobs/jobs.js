document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Load user profile picture
    loadUserProfile();

    // Load jobs
    loadJobs();

    // Event Listeners
    document.getElementById('jobSearchForm').addEventListener('submit', handleJobSearch);
    
    // Post Job Button
    const postJobBtn = document.getElementById('postJobBtn');
    if (postJobBtn) {
        postJobBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('postJobModal'));
            modal.show();
        });
    }

    // Submit Job Button
    const submitJobBtn = document.getElementById('submitJobBtn');
    if (submitJobBtn) {
        submitJobBtn.addEventListener('click', handlePostJob);
    }

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (response.ok) {
            const user = await response.json();
            const profilePic = document.getElementById('profilePicture');
            if (profilePic) {
                profilePic.src = user.profile_photo || '/static/uploads/default-profile.png';
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadJobs() {
    const jobsContainer = document.getElementById('jobsContainer');
    if (!jobsContainer) {
        console.error('Jobs container not found');
        return;
    }

    jobsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('/api/jobs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load jobs');
        }
        
        const jobs = await response.json();
        
        if (jobs.length === 0) {
            jobsContainer.innerHTML = '<div class="alert alert-info">No jobs found. Be the first to post a job!</div>';
            return;
        }
        
        jobsContainer.innerHTML = '';
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsContainer.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsContainer.innerHTML = '<div class="alert alert-danger">Failed to load jobs. Please try again later.</div>';
    }
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${job.title}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${job.company_name}</h6>
            <p class="card-text">
                <i class="fas fa-map-marker-alt"></i> ${job.location}<br>
                <i class="fas fa-briefcase"></i> ${job.job_type}<br>
                <i class="fas fa-clock"></i> ${job.required_experience}
            </p>
            <p class="card-text">${job.description}</p>
            <button class="btn btn-primary apply-btn" data-job-id="${job.id}">
                Apply Now
            </button>
        </div>
    `;

    // Add click event listener to the Apply Now button
    const applyBtn = card.querySelector('.apply-btn');
    applyBtn.addEventListener('click', () => handleApplyJob(job.id));

    return card;
}

async function handleJobSearch(event) {
    event.preventDefault();
    const jobsContainer = document.getElementById('jobsContainer');
    jobsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    const title = document.getElementById('jobTitle').value;
    const location = document.getElementById('location').value;
    const type = document.getElementById('jobType').value;

    try {
        const queryParams = new URLSearchParams();
        if (title) queryParams.append('q', title);
        if (location) queryParams.append('location', location);
        if (type) queryParams.append('type', type);

        const response = await fetch(`/api/jobs/search?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search jobs');
        }

        const jobs = await response.json();
        
        if (jobs.length === 0) {
            jobsContainer.innerHTML = '<div class="alert alert-info">No jobs found matching your criteria.</div>';
            return;
        }

        jobsContainer.innerHTML = '';
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsContainer.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error searching jobs:', error);
        jobsContainer.innerHTML = '<div class="alert alert-danger">Failed to search jobs. Please try again later.</div>';
    }
}

async function handlePostJob() {
    const form = document.getElementById('postJobForm');
    const formData = {
        title: document.getElementById('jobTitleInput').value,
        company_name: document.getElementById('companyNameInput').value,
        location: document.getElementById('locationInput').value,
        job_type: document.getElementById('jobTypeInput').value,
        required_experience: document.getElementById('experienceInput').value,
        description: document.getElementById('descriptionInput').value
    };

    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to post job');
        }

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('postJobModal'));
        modal.hide();
        form.reset();

        // Reload jobs
        loadJobs();

        // Show success message
        alert('Job posted successfully!');
    } catch (error) {
        console.error('Error posting job:', error);
        alert(error.message || 'Failed to post job. Please try again.');
    }
}

async function handleApplyJob(jobId) {
    try {
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to apply for job');
        }

        const application = await response.json();
        
        // Update the button to show applied status
        const applyBtn = document.querySelector(`.apply-btn[data-job-id="${jobId}"]`);
        if (applyBtn) {
            applyBtn.textContent = 'Applied';
            applyBtn.disabled = true;
            applyBtn.classList.remove('btn-primary');
            applyBtn.classList.add('btn-secondary');
        }

        alert('Application submitted successfully!');
    } catch (error) {
        console.error('Error applying for job:', error);
        alert(error.message || 'Failed to apply for job. Please try again.');
    }
}

function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
} 