import { initProtectedPage, getCurrentUser } from '../../src/utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize protected page functionality
    initProtectedPage();

    // Get and display user information
    const user = getCurrentUser();
    if (user) {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = `Welcome, ${user.first_name || user.email}`;
        }
    }
    const viewProfileButtons = document.querySelectorAll('button, a');
    viewProfileButtons.forEach(button => {
        if (button.textContent.trim() === 'View Profile') {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/userprofile';
            });
        }
    });

    // Post form submission
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(postForm);
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                alert('Please log in to post');
                return;
            }

            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server response:', errorData);
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Store the post in localStorage
                const user = JSON.parse(localStorage.getItem('user')) || {};
                const posts = user.posts || [];
                posts.unshift({
                    content: formData.get('content'),
                    date: new Date().toISOString().split('T')[0],
                    image_url: data.image_url || null
                });
                user.posts = posts;
                localStorage.setItem('user', JSON.stringify(user));
                
                postForm.reset();
                await fetchAndRenderPosts();
            } catch (err) {
                console.error('Error sharing post:', err);
                alert(err.message || 'Error sharing post. Please try again.');
            }
        });
    }

    // Fetch and render posts
    async function fetchAndRenderPosts() {
        const postsFeed = document.getElementById('postsFeed');
        if (!postsFeed) {
            console.error('Posts feed element not found');
            return;
        }
        
        postsFeed.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/posts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server response:', errorData);
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            console.log('Received posts:', posts);
            
            postsFeed.innerHTML = '';
            
            if (posts.length === 0) {
                postsFeed.innerHTML = '<div class="alert alert-info">No posts yet. Be the first to share!</div>';
                return;
            }
            
            posts.forEach(post => {
                try {
                    const postCard = renderPost(post);
                    postsFeed.appendChild(postCard);
                } catch (err) {
                    console.error('Error rendering post:', err);
                    console.error('Problematic post data:', post);
                }
            });
        } catch (err) {
            console.error('Error fetching posts:', err);
            postsFeed.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Error Loading Posts</h5>
                    <p>${err.message || 'Failed to load posts.'}</p>
                    <button class="btn btn-outline-danger btn-sm mt-2" onclick="fetchAndRenderPosts()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    function renderPost(post) {
        const postElement = document.createElement('div');
        postElement.className = 'card mb-3';
        postElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <img src="${post.author_profile_photo || '/images/default-profile.png'}" 
                         class="rounded-circle me-2" 
                         style="width: 48px; height: 48px; object-fit: cover;">
                    <div>
                        <h5 class="card-title mb-0">${post.author_name}</h5>
                        <p class="text-muted mb-0">${post.author_job_title || ''}</p>
                    </div>
                </div>
                <p class="card-text">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mb-3" alt="Post Image">` : ''}
                <div class="d-flex align-items-center mb-3">
                    <button class="btn btn-link text-decoration-none like-btn" data-post-id="${post.id}">
                        <i class="fas fa-heart ${post.liked_by_user ? 'text-danger' : 'text-muted'}"></i>
                        <span class="likes-count">${post.likes_count}</span>
                    </button>
                    <button class="btn btn-link text-decoration-none comment-btn" data-post-id="${post.id}">
                        <i class="fas fa-comment text-muted"></i>
                        <span class="comments-count">${post.comments ? post.comments.length : 0}</span>
                    </button>
                    <small class="text-muted ms-2">${new Date(post.created_at).toLocaleDateString()}</small>
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

        // Add like button functionality
        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`/api/posts/${post.id}/${post.liked_by_user ? 'unlike' : 'like'}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const likesCount = postElement.querySelector('.likes-count');
                    const heartIcon = postElement.querySelector('.fa-heart');
                    
                    likesCount.textContent = data.likes_count;
                    if (post.liked_by_user) {
                        heartIcon.classList.remove('text-danger');
                        heartIcon.classList.add('text-muted');
                    } else {
                        heartIcon.classList.remove('text-muted');
                        heartIcon.classList.add('text-danger');
                    }
                    post.liked_by_user = !post.liked_by_user;
                    post.likes_count = data.likes_count;
                } else {
                    const error = await response.json();
                    console.error('Like/unlike error:', error);
                    alert(error.error || error.details || 'Failed to update like status');
                }
            } catch (err) {
                console.error('Error updating like:', err);
                alert('Failed to update like status. Please try again.');
            }
        });

        // Add comment button functionality
        const commentBtn = postElement.querySelector('.comment-btn');
        const commentsSection = postElement.querySelector('.comments-section');
        const commentsList = postElement.querySelector('.comments-list');
        
        commentBtn.addEventListener('click', async () => {
            if (commentsSection.style.display === 'none') {
                commentsSection.style.display = 'block';
                await loadComments(post.id, commentsList);
            } else {
                commentsSection.style.display = 'none';
            }
        });

        // Add comment form submission
        const commentForm = postElement.querySelector('.comment-form');
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = commentForm.querySelector('input');
            const content = input.value.trim();
            
            if (!content) return;

            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

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
                    const commentsCount = postElement.querySelector('.comments-count');
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

        return postElement;
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

    // Initial fetch of posts
    fetchAndRenderPosts();

    // Load connections for the sidebar
    async function loadConnections() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/connections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load connections');
            }

            const data = await response.json();
            const connectionsList = document.getElementById('connectionsList');
            
            if (data.connections.length === 0) {
                connectionsList.innerHTML = `
                    <div class="list-group-item text-muted">
                        No connections yet
                    </div>
                `;
                return;
            }

            connectionsList.innerHTML = data.connections.map(user => `
                <div class="list-group-item d-flex align-items-center">
                    <img src="${user.profile_photo || '/static/default-profile.png'}" 
                         class="rounded-circle me-2" 
                         style="width:30px; height:30px;"
                         alt="${user.first_name || ''}">
                    <span>${user.first_name || ''} ${user.last_name || ''}</span>
                    <button class="btn btn-outline-primary btn-sm ms-auto view-profile-btn" 
                            data-user-id="${user.id}">
                        View Profile
                    </button>
                </div>
            `).join('');
            // Attach event listeners for view profile buttons
            connectionsList.querySelectorAll('.view-profile-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = btn.getAttribute('data-user-id');
                    window.location.href = `/userprofile?id=${userId}`;
                });
            });
        } catch (error) {
            console.error('Error loading connections:', error);
            document.getElementById('connectionsList').innerHTML = `
                <div class="list-group-item text-danger">
                    Error loading connections
                </div>
            `;
        }
    }

    // Load suggested connections
    async function loadSuggestedConnections() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/suggested-connections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load suggested connections');
            }

            const data = await response.json();
            const suggestedList = document.getElementById('suggestedConnectionsList');
            
            if (data.suggested_connections.length === 0) {
                suggestedList.innerHTML = `
                    <div class="list-group-item text-muted">
                        No suggested connections
                    </div>
                `;
                return;
            }

            suggestedList.innerHTML = data.suggested_connections.map(user => `
                <div class="list-group-item d-flex align-items-center">
                    <img src="${user.profile_photo || '/static/default-profile.png'}" 
                         class="rounded-circle me-2" 
                         style="width:30px; height:30px;"
                         alt="${user.first_name}">
                    <span>${user.first_name} ${user.last_name}</span>
                    <button class="btn btn-outline-primary btn-sm ms-auto connect-btn" 
                            data-user-id="${user.id}">
                        Connect
                    </button>
                </div>
            `).join('');
            // Attach event listeners for connect buttons
            suggestedList.querySelectorAll('.connect-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = btn.getAttribute('data-user-id');
                    await connect(userId);
                });
            });
        } catch (error) {
            console.error('Error loading suggested connections:', error);
            document.getElementById('suggestedConnectionsList').innerHTML = `
                <div class="list-group-item text-danger">
                    Error loading suggested connections
                </div>
            `;
        }
    }

    // Connect with a user
    async function connect(userId) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/connect/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to send connection request');
            }

            // Reload suggested connections
            loadSuggestedConnections();
        } catch (error) {
            console.error('Error sending connection request:', error);
            alert('Failed to send connection request. Please try again.');
        }
    }

    // View user profile
    function viewProfile(userId) {
        window.location.href = `/userprofile?id=${userId}`;
    }

    // Load connections when the page loads
    loadConnections();
    loadSuggestedConnections();
}); 