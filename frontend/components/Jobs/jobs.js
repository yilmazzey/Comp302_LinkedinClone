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
            console.log('Post job button clicked'); // Debug log
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
            document.getElementById('profilePicture').src = user.profile_photo || '/static/uploads/default-profile.png';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadJobs() {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
        const response = await fetch('/api/jobs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch jobs');
        }

        const jobs = await response.json();
        
        if (jobs.length === 0) {
            jobsList.innerHTML = '<div class="alert alert-info">No jobs found. Be the first to post a job!</div>';
            return;
        }

        jobsList.innerHTML = '';
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsList.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsList.innerHTML = '<div class="alert alert-danger">Failed to load jobs. Please try again later.</div>';
    }
}

function createJobCard(job) {
    const div = document.createElement('div');
    div.className = 'job-card';
    div.innerHTML = `
        <h3 class="job-title">${job.title}</h3>
        <h4 class="company-name">${job.company_name}</h4>
        <p class="job-location">
            <i class="fas fa-map-marker-alt"></i> ${job.location}
            <span class="job-type ms-2">${job.job_type}</span>
        </p>
        <p class="job-description">${job.description}</p>
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">Posted ${new Date(job.created_at).toLocaleDateString()}</small>
            <button class="btn btn-outline-primary btn-sm apply-btn" data-job-id="${job.id}">
                Apply Now
            </button>
        </div>
    `;

    // Add event listener to apply button
    const applyBtn = div.querySelector('.apply-btn');
    applyBtn.addEventListener('click', () => handleApplyJob(job.id));

    return div;
}

async function handleJobSearch(event) {
    event.preventDefault();
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

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
            jobsList.innerHTML = '<div class="alert alert-info">No jobs found matching your criteria.</div>';
            return;
        }

        jobsList.innerHTML = '';
        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsList.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error searching jobs:', error);
        jobsList.innerHTML = '<div class="alert alert-danger">Failed to search jobs. Please try again later.</div>';
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
    // This is a placeholder for job application functionality
    alert('Application functionality will be implemented soon!');
}

function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
} 