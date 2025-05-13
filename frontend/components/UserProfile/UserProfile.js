document.addEventListener('DOMContentLoaded', () => {
    // Get user ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id');

    // Fetch latest user info from backend
    async function fetchAndRenderUserProfile() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // If we have a target user ID, fetch that user's profile, otherwise fetch current user's profile
            const endpoint = targetUserId ? `/api/profile/${targetUserId}` : '/api/profile';
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const user = await response.json();
            console.log('Fetched user data:', user);

            // Update localStorage with latest user data only if it's the current user's profile
            if (!targetUserId) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Set profile picture with fallback
            const profilePic = document.getElementById('profilePicture');
            profilePic.src = user.profile_photo || '/static/uploads/default-profile.png';
            profilePic.onerror = function() {
                this.src = 'https://via.placeholder.com/150';
            };
            
            // Set user info
            document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('userTitle').textContent = user.job_title || '';
            document.getElementById('userLocation').textContent = user.location || '';
            document.getElementById('connectionCount').textContent = `${user.connections_count || 0} connections`;
            document.getElementById('userBio').textContent = user.bio || '';

            // Show/hide edit buttons based on whether it's the current user's profile
            const editButtons = document.querySelectorAll('.edit-profile-btn');
            editButtons.forEach(btn => {
                btn.style.display = targetUserId ? 'none' : 'block';
            });

            // Render experience
            const experienceList = document.getElementById('experienceList');
            experienceList.innerHTML = '';
            let experience = user.experience;
            try { 
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

            // Render education
            const educationList = document.getElementById('educationList');
            educationList.innerHTML = '';
            let education = user.education;
            try { 
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
            // Fallback to localStorage if backend fails and it's the current user's profile
            if (!targetUserId) {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                document.getElementById('profilePicture').src = user.profile_photo || 'https://via.placeholder.com/150';
                document.getElementById('userName').textContent = `${user.first_name || ''} ${user.last_name || ''}`;
                document.getElementById('userTitle').textContent = user.job_title || '';
                document.getElementById('userLocation').textContent = user.location || '';
                document.getElementById('connectionCount').textContent = `${user.connections_count || 0} connections`;
                document.getElementById('userBio').textContent = user.bio || '';
            } else {
                // Show error message for other users' profiles
                document.getElementById('userName').textContent = 'Profile Not Found';
                document.getElementById('userTitle').textContent = '';
                document.getElementById('userLocation').textContent = '';
                document.getElementById('connectionCount').textContent = '0 connections';
                document.getElementById('userBio').textContent = 'This profile could not be loaded.';
            }
        }
    }

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
                        <div class="d-flex align-items-center mb-3">
                            <button class="btn btn-outline-primary btn-sm me-2 like-btn ${post.liked_by_user ? 'active' : ''}" data-post-id="${post.id}">
                                <i class="fas fa-heart"></i> 
                                <span class="like-count">${post.likes_count}</span>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm comment-btn" data-post-id="${post.id}">
                                <i class="fas fa-comment"></i>
                                <span class="comments-count">${post.comments ? post.comments.length : 0}</span>
                            </button>
                        </div>
                        <div class="comments-section" id="comments-${post.id}" style="display: none;">
                            <div class="comments-list mb-3"></div>
                            <form class="comment-form" data-post-id="${post.id}">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Write a comment..." required>
                                    <button class="btn btn-primary" type="submit">Post</button>
                                </div>
                            </form>
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

                // Add comment button functionality
                const commentBtn = card.querySelector('.comment-btn');
                const commentsSection = card.querySelector('.comments-section');
                const commentsList = card.querySelector('.comments-list');
                
                commentBtn.addEventListener('click', async () => {
                    if (commentsSection.style.display === 'none') {
                        commentsSection.style.display = 'block';
                        await loadComments(post.id, commentsList);
                    } else {
                        commentsSection.style.display = 'none';
                    }
                });

                // Add comment form submission
                const commentForm = card.querySelector('.comment-form');
                commentForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const input = commentForm.querySelector('input');
                    const content = input.value.trim();
                    
                    if (!content) return;

                    try {
                        const response = await fetch(`/api/posts/${post.id}/comments`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ content })
                        });

                        if (response.ok) {
                            const comment = await response.json();
                            const commentsCount = card.querySelector('.comments-count');
                            commentsCount.textContent = parseInt(commentsCount.textContent) + 1;
                            
                            // Add new comment to the list
                            const commentElement = createCommentElement(comment);
                            commentsList.appendChild(commentElement);
                            
                            // Clear input
                            input.value = '';
                        } else {
                            const error = await response.json();
                            throw new Error(error.error || error.details || 'Failed to add comment');
                        }
                    } catch (err) {
                        console.error('Error adding comment:', err);
                        alert(err.message || 'Failed to add comment. Please try again.');
                    }
                });
            });
        } catch (err) {
            console.error('Error fetching posts:', err);
            postsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load posts: ${err.message}
                    <button class="btn btn-link" onclick="fetchAndRenderUserPosts(${userId})">Try Again</button>
                </div>`;
        }
    }

    async function loadComments(postId, commentsList) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const comments = await response.json();
                commentsList.innerHTML = '';
                comments.forEach(comment => {
                    const commentElement = createCommentElement(comment);
                    commentsList.appendChild(commentElement);
                });
            } else {
                throw new Error('Failed to load comments');
            }
        } catch (err) {
            console.error('Error loading comments:', err);
            commentsList.innerHTML = '<div class="alert alert-danger">Failed to load comments</div>';
        }
    }

    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment mb-2';
        div.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    <strong>${comment.author_name || 'User'}</strong>
                    <p class="mb-0">${comment.content}</p>
                    <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                </div>
            </div>
        `;
        return div;
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
        window.location.href = '/components/Profile/Profile.html';
    });
    
    document.getElementById('addEducationBtn').addEventListener('click', () => {
        window.location.href = '/components/Profile/Profile.html';
    });
    
    document.getElementById('editPhotoBtn').addEventListener('click', () => {
        window.location.href = '/components/Profile/Profile.html';
    });
}); 