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
        if (!postsFeed) return;
        
        postsFeed.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
        
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status}`);
            }
            
            const posts = await response.json();
            postsFeed.innerHTML = '';
            
            if (posts.length === 0) {
                postsFeed.innerHTML = '<div class="alert alert-info">No posts yet. Be the first to share!</div>';
                return;
            }
            
            posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.className = 'card mb-3';
                postCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${post.author_profile_photo || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" style="width:40px; height:40px;">
                            <div>
                                <strong>${post.author_first_name || ''} ${post.author_last_name || ''}</strong><br>
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
                postsFeed.appendChild(postCard);
            });
        } catch (err) {
            console.error('Error fetching posts:', err);
            postsFeed.innerHTML = `<div class="alert alert-danger">${err.message || 'Failed to load posts.'}</div>`;
        }
    }

    // Initial fetch of posts
    fetchAndRenderPosts();
}); 