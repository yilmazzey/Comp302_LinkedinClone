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
                <div class="d-flex align-items-center">
                    <button class="btn btn-link text-decoration-none like-btn" data-post-id="${post.id}">
                        <i class="fas fa-heart ${post.liked_by_user ? 'text-danger' : 'text-muted'}"></i>
                        <span class="likes-count">${post.likes_count}</span>
                    </button>
                    <small class="text-muted ms-2">${new Date(post.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `;

        // Add like button event listener
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
                    // Update the like count and button state
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

        return postElement;
    }

    // Initial fetch of posts
    fetchAndRenderPosts();
}); 