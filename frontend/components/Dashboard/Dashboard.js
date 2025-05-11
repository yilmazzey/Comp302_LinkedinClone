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
                const response = await fetch('http://127.0.0.1:5000/api/posts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                postForm.reset();
                await fetchAndRenderPosts();
            } catch (err) {
                console.error('Error sharing post:', err);
                alert('Error sharing post. Please try again.');
            }
        });
    }

    // Fetch and render posts
    async function fetchAndRenderPosts() {
        const postsFeed = document.getElementById('postsFeed');
        postsFeed.innerHTML = '';
        try {
            const response = await fetch('http://127.0.0.1:5000/api/posts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const posts = await response.json();
            posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.className = 'card mb-3';
                postCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="https://via.placeholder.com/40" class="rounded-circle me-2" style="width:40px; height:40px;">
                            <div>
                                <strong>User ${post.author_id}</strong><br>
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
            postsFeed.innerHTML = '<div class="alert alert-danger">Failed to load posts.</div>';
        }
    }

    fetchAndRenderPosts();
}); 