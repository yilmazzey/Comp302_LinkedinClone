document.addEventListener('DOMContentLoaded', () => {
    // Fetch latest user info from backend
    async function fetchAndRenderUserProfile() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const user = await response.json();
            
            // Update localStorage with latest user data
            localStorage.setItem('user', JSON.stringify(user));
            
            // Set profile picture
            document.getElementById('profilePicture').src = user.profile_photo || "https://via.placeholder.com/150";
            
            // Set user info
            document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('userTitle').textContent = user.job_title || '';
            document.getElementById('userLocation').textContent = user.location || '';
            document.getElementById('connectionCount').textContent = `${user.connections || 0}+ connections`;
            document.getElementById('userBio').textContent = user.bio || '';
            
            // Render experience
            const experienceList = document.getElementById('experienceList');
            experienceList.innerHTML = '';
            let experience = user.experience;
            try { 
                experience = JSON.parse(experience); 
            } catch (e) {
                experience = [];
            }
            if (!Array.isArray(experience)) experience = [];
            experience.forEach(exp => {
                const div = document.createElement('div');
                div.className = "mb-2";
                div.innerHTML = `<strong>${exp.role}</strong> at ${exp.company}<br><span class="text-muted">${exp.years}</span>`;
                experienceList.appendChild(div);
            });
            
            // Render education
            const educationList = document.getElementById('educationList');
            educationList.innerHTML = '';
            let education = user.education;
            try { 
                education = JSON.parse(education); 
            } catch (e) {
                education = [];
            }
            if (!Array.isArray(education)) education = [];
            education.forEach(edu => {
                const div = document.createElement('div');
                div.className = "mb-2";
                div.innerHTML = `<strong>${edu.school}</strong><br>${edu.degree}<br><span class="text-muted">${edu.years}</span>`;
                educationList.appendChild(div);
            });
            
            // Fetch and render user's posts
            fetchAndRenderUserPosts(user.id, user);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // fallback to localStorage if backend fails
            const user = JSON.parse(localStorage.getItem('user')) || {};
            document.getElementById('profilePicture').src = user.profile_photo || "https://via.placeholder.com/150";
            document.getElementById('userName').textContent = `${user.first_name || ''} ${user.last_name || ''}`;
            document.getElementById('userTitle').textContent = user.job_title || '';
            document.getElementById('userLocation').textContent = user.location || '';
            document.getElementById('connectionCount').textContent = `${user.connections || 0}+ connections`;
            document.getElementById('userBio').textContent = user.bio || '';
        }
    }

    // Initial fetch of profile data
    fetchAndRenderUserProfile();

    // Add event listener for the Edit Profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/components/Profile/Profile.html';
        });
    }

    const backButton = document.getElementById('backToDashboardBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = '/components/Dashboard/Dashboard.html';
        });
    }

    // Fetch and render posts for this user from backend
    async function fetchAndRenderUserPosts(userId, user) {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error('Failed to fetch posts');
            const posts = await response.json();
            // Filter posts by current user
            const userPosts = posts.filter(post => post.author_id === userId);
            const postsFeed = document.getElementById('postsFeed');
            
            if (userPosts.length === 0) {
                postsFeed.innerHTML = '<div class="alert alert-info">No posts yet.</div>';
                return;
            }
            
            postsFeed.innerHTML = '';
            userPosts.forEach(post => {
                const card = document.createElement('div');
                card.className = "card mb-3";
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${post.author_profile_photo || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" style="width:40px; height:40px;">
                            <div>
                                <strong>${post.author_first_name} ${post.author_last_name}</strong><br>
                                <small>${new Date(post.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p>${post.content}</p>
                        ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mb-2" alt="Post Image">` : ''}
                        <div>
                            <button class="btn btn-outline-primary btn-sm me-2"><i class="fas fa-thumbs-up"></i> Like</button>
                            <button class="btn btn-outline-secondary btn-sm"><i class="fas fa-comment"></i> Comment</button>
                        </div>
                    </div>
                `;
                postsFeed.appendChild(card);
            });
        } catch (err) {
            console.error('Error fetching posts:', err);
            const postsFeed = document.getElementById('postsFeed');
            postsFeed.innerHTML = `<div class='alert alert-danger'>${err.message || 'Failed to load posts.'}</div>`;
        }
    }

    // Add Experience/Education (dummy handlers)
    document.getElementById('addExperienceBtn').addEventListener('click', () => {
        alert('Add Experience functionality coming soon!');
    });
    document.getElementById('addEducationBtn').addEventListener('click', () => {
        alert('Add Education functionality coming soon!');
    });
    document.getElementById('editPhotoBtn').addEventListener('click', () => {
        alert('Change Profile Photo functionality coming soon!');
    });
}); 