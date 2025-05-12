document.addEventListener('DOMContentLoaded', () => {
    // Fetch latest user info from backend
    async function fetchAndRenderUserProfile() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const user = await response.json();
<<<<<<< HEAD
            
            // Update localStorage with latest user data
            localStorage.setItem('user', JSON.stringify(user));
            
            // Set profile picture
            document.getElementById('profilePicture').src = user.profile_photo || "https://via.placeholder.com/150";
=======
            console.log('Fetched user data:', user);

            // Update localStorage with latest user data
            localStorage.setItem('user', JSON.stringify(user));

            // Set profile picture with fallback
            const profilePic = document.getElementById('profilePicture');
            profilePic.src = user.profile_photo || '/static/uploads/default-profile.png';
            profilePic.onerror = function() {
                this.src = 'https://via.placeholder.com/150';
            };
>>>>>>> SOFT-102
            
            // Set user info
            document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('userTitle').textContent = user.job_title || '';
            document.getElementById('userLocation').textContent = user.location || '';
            document.getElementById('connectionCount').textContent = `${user.connections || 0}+ connections`;
            document.getElementById('userBio').textContent = user.bio || '';
<<<<<<< HEAD
            
=======

>>>>>>> SOFT-102
            // Render experience
            const experienceList = document.getElementById('experienceList');
            experienceList.innerHTML = '';
            let experience = user.experience;
            try { 
<<<<<<< HEAD
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
            
=======
                experience = JSON.parse(user.experience); 
            } catch (e) {
                console.log('Experience parsing error:', e);
            }
            
            if (Array.isArray(experience)) {
                experience.forEach(exp => {
                    const div = document.createElement('div');
                    div.className = "mb-2";
                    div.innerHTML = `<strong>${exp.role}</strong> at ${exp.company}<br><span class="text-muted">${exp.years}</span>`;
                    experienceList.appendChild(div);
                });
            }

>>>>>>> SOFT-102
            // Render education
            const educationList = document.getElementById('educationList');
            educationList.innerHTML = '';
            let education = user.education;
            try { 
<<<<<<< HEAD
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
=======
                education = JSON.parse(user.education); 
            } catch (e) {
                console.log('Education parsing error:', e);
            }
            
            if (Array.isArray(education)) {
                education.forEach(edu => {
                    const div = document.createElement('div');
                    div.className = "mb-2";
                    div.innerHTML = `<strong>${edu.school}</strong><br>${edu.degree}<br><span class="text-muted">${edu.years}</span>`;
                    educationList.appendChild(div);
                });
            }

            // Fetch and render user's posts
            await fetchAndRenderUserPosts(user.id);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Fallback to localStorage if backend fails
>>>>>>> SOFT-102
            const user = JSON.parse(localStorage.getItem('user')) || {};
            document.getElementById('profilePicture').src = user.profile_photo || 'https://via.placeholder.com/150';
            document.getElementById('userName').textContent = `${user.first_name || ''} ${user.last_name || ''}`;
            document.getElementById('userTitle').textContent = user.job_title || '';
            document.getElementById('userLocation').textContent = user.location || '';
            document.getElementById('connectionCount').textContent = `${user.connections || 0}+ connections`;
            document.getElementById('userBio').textContent = user.bio || '';
        }
    }
<<<<<<< HEAD

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
=======

    // Fetch and render posts for this user
    async function fetchAndRenderUserPosts(userId) {
        const postsContainer = document.getElementById('userPosts');
        if (!postsContainer) {
            console.error('Posts container not found');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching user posts...');
            // Show loading state
            postsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

            // Get all posts and filter for this user
            const response = await fetch('/api/posts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch posts');
            }

            const allPosts = await response.json();
            console.log('Fetched all posts:', allPosts);

            // Filter posts for this user
            const userPosts = allPosts.filter(post => post.author_id === userId);
            console.log('Filtered user posts:', userPosts);

            // Clear loading state
            postsContainer.innerHTML = '';

            if (!userPosts.length) {
                postsContainer.innerHTML = '<div class="alert alert-info">No posts yet. Start sharing your thoughts!</div>';
                return;
            }

            // Sort posts by creation date (newest first)
            userPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

>>>>>>> SOFT-102
            userPosts.forEach(post => {
                console.log('Rendering post:', post);
                const card = document.createElement('div');
                card.className = "card mb-3";
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${post.author_profile_photo || '/static/uploads/default-profile.png'}" 
                                 class="rounded-circle me-2" 
                                 style="width:40px; height:40px; object-fit: cover;"
                                 onerror="this.src='https://via.placeholder.com/40'">
                            <div>
                                <strong>${post.author_name}</strong><br>
                                <small class="text-muted">${new Date(post.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <p class="card-text">${post.content}</p>
                        ${post.image_url ? `
                            <img src="${post.image_url}" 
                                 class="img-fluid rounded mb-2" 
                                 alt="Post Image"
                                 onerror="this.style.display='none'">` 
                        : ''}
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-primary btn-sm me-2 like-btn ${post.liked_by_user ? 'active' : ''}" data-post-id="${post.id}">
                                <i class="fas fa-heart"></i> 
                                <span class="like-count">${post.likes_count}</span>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm">
                                <i class="fas fa-comment"></i> Comment
                            </button>
                        </div>
                    </div>
                `;
                postsContainer.appendChild(card);

                // Add like button functionality
                const likeBtn = card.querySelector('.like-btn');
                likeBtn.addEventListener('click', async () => {
                    try {
                        const isLiked = likeBtn.classList.contains('active');
                        const action = isLiked ? 'unlike' : 'like';
                        const response = await fetch(`/api/posts/${post.id}/${action}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to ${action} post`);
                        }

                        const result = await response.json();
                        const likeCount = likeBtn.querySelector('.like-count');
                        likeCount.textContent = result.likes_count;
                        likeBtn.classList.toggle('active');
                    } catch (err) {
                        console.error(`Error ${action}ing post:`, err);
                        alert(`Failed to ${action} post. Please try again.`);
                    }
                });
            });
        } catch (err) {
            console.error('Error fetching posts:', err);
<<<<<<< HEAD
            const postsFeed = document.getElementById('postsFeed');
            postsFeed.innerHTML = `<div class='alert alert-danger'>${err.message || 'Failed to load posts.'}</div>`;
=======
            postsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load posts: ${err.message}
                    <button class="btn btn-link" onclick="fetchAndRenderUserPosts(${userId})">Try Again</button>
                </div>`;
>>>>>>> SOFT-102
        }
    }

    // Initialize profile
    fetchAndRenderUserProfile();

    // Add event listeners
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = '/components/Profile/Profile.html';
        });
    }

    const backButton = document.getElementById('backToDashboardBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = '/components/Dashboard/Dashboard.html';
        });
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