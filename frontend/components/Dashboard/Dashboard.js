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
                    <img src="${post.author_profile_photo || '/static/uploads/default-profile.png'}" 
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
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = currentUser.is_admin === true;
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment mb-2 p-2 border-bottom';
        commentElement.id = `comment-${comment.id}`;
        commentElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${comment.author_name}</strong>
                    <p class="mb-1">${comment.content}</p>
                    <small class="text-muted">${new Date(comment.created_at).toLocaleDateString()}</small>
                </div>
                ${isAdmin ? `
                    <button class="btn btn-sm btn-danger delete-comment-btn" 
                            onclick="deleteComment(${comment.id})" 
                            title="Delete Comment">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        return commentElement;
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
                    <img src="${user.profile_photo || '/static/uploads/default-profile.png'}" 
                         class="rounded-circle me-2" 
                         style="width:30px; height:30px; object-fit:cover;"
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

    // 1. Inject messaging modal HTML if not present
    function injectMessagingModal() {
        if (document.getElementById('messagingModal')) return;
        const modal = document.createElement('div');
        modal.id = 'messagingModal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.3)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90vw;max-width:800px;height:80vh;background:#fff;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,0.18);display:flex;overflow:hidden;">
            <div id="messagingConnections" style="width:240px;background:#f3f2ef;border-right:1px solid #eee;overflow-y:auto;padding:0.5rem 0;"></div>
            <div style="flex:1;display:flex;flex-direction:column;">
              <div id="messagingHeader" style="padding:1rem;border-bottom:1px solid #eee;font-weight:bold;font-size:1.1rem;"></div>
              <div id="messagingChat" style="flex:1;overflow-y:auto;padding:1rem;background:#fafbfc;"></div>
              <form id="messagingForm" style="display:flex;gap:8px;padding:1rem;border-top:1px solid #eee;background:#fff;">
                <input id="messagingInput" class="form-control" type="text" placeholder="Type a message..." style="flex:1;" required />
                <button class="btn btn-primary" type="submit">Send</button>
              </form>
            </div>
            <button id="messagingClose" style="position:absolute;top:12px;right:16px;font-size:1.5rem;background:none;border:none;color:#888;cursor:pointer;">&times;</button>
          </div>
        `;
        document.body.appendChild(modal);
    }

    // 2. Open/close modal logic
    function openMessagingModal() {
        injectMessagingModal();
        document.getElementById('messagingModal').style.display = 'block';
        loadMessagingConnections();
    }
    function closeMessagingModal() {
        document.getElementById('messagingModal').style.display = 'none';
        // Optionally clear chat
        document.getElementById('messagingChat').innerHTML = '';
        document.getElementById('messagingHeader').textContent = '';
    }

    // 3. Load connections in modal
    async function loadMessagingConnections() {
        const token = localStorage.getItem('access_token');
        const sidebar = document.getElementById('messagingConnections');
        sidebar.innerHTML = '<div class="text-center text-muted p-2">Loading...</div>';
        try {
            const response = await fetch('/api/connections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load connections');
            const data = await response.json();
            if (!data.connections.length) {
                sidebar.innerHTML = '<div class="text-center text-muted p-2">No connections</div>';
                return;
            }
            sidebar.innerHTML = data.connections.map(user => `
              <div class="d-flex align-items-center p-2 messaging-connection" data-user-id="${user.id}" style="cursor:pointer;gap:10px;">
                <img src="${user.profile_photo || '/static/uploads/default-profile.png'}" style="width:36px;height:36px;object-fit:cover;border-radius:50%;">
                <span>${user.first_name || ''} ${user.last_name || ''}</span>
              </div>
            `).join('');
            // Add click listeners
            sidebar.querySelectorAll('.messaging-connection').forEach(el => {
                el.addEventListener('click', () => {
                    selectMessagingConnection(el.getAttribute('data-user-id'), el.querySelector('span').textContent, el.querySelector('img').src);
                });
            });
        } catch (err) {
            sidebar.innerHTML = '<div class="text-danger p-2">Failed to load connections</div>';
        }
    }

    // 4. Load chat history and handle sending
    let currentChatUserId = null;
    function selectMessagingConnection(userId, userName, userPhoto) {
        currentChatUserId = userId;
        document.getElementById('messagingHeader').innerHTML = `<img src="${userPhoto}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;margin-right:8px;">${userName}`;
        loadChatHistory(userId);
    }
    async function loadChatHistory(userId) {
        const token = localStorage.getItem('access_token');
        const chat = document.getElementById('messagingChat');
        chat.innerHTML = '<div class="text-center text-muted">Loading...</div>';
        try {
            const response = await fetch(`/api/messages/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load messages');
            const data = await response.json();
            if (!data.messages.length) {
                chat.innerHTML = '<div class="text-center text-muted">No messages yet</div>';
                return;
            }
            chat.innerHTML = data.messages.map(msg => `
              <div style="display:flex;align-items:flex-end;margin-bottom:10px;${msg.sender_id == userId ? '' : 'flex-direction:row-reverse;'}">
                <img src="${msg.sender_photo || '/static/uploads/default-profile.png'}" style="width:28px;height:28px;object-fit:cover;border-radius:50%;margin:0 8px;">
                <div style="background:${msg.sender_id == userId ? '#f3f2ef' : '#0a66c2'};color:${msg.sender_id == userId ? '#222' : '#fff'};padding:8px 14px;border-radius:16px;max-width:60%;word-break:break-word;">
                  ${msg.content}
                  <div style="font-size:0.8em;color:#888;margin-top:2px;text-align:right;">${new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
            `).join('');
            chat.scrollTop = chat.scrollHeight;
        } catch (err) {
            chat.innerHTML = '<div class="text-danger">Failed to load messages</div>';
        }
    }
    // Send message
    function setupMessagingForm() {
        const form = document.getElementById('messagingForm');
        if (!form) return;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('messagingInput');
            const content = input.value.trim();
            if (!content || !currentChatUserId) return;
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch(`/api/messages/${currentChatUserId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content })
                });
                if (!response.ok) throw new Error('Failed to send message');
                input.value = '';
                await loadChatHistory(currentChatUserId);
            } catch (err) {
                alert('Failed to send message');
            }
        };
    }

    // 5. Add event listeners for modal open/close
    function setupMessagingButton() {
        // Try to find a Messaging button in the navbar
        let btn = document.getElementById('messagingNavBtn');
        if (!btn) {
            // If not present, create one for demo
            const nav = document.querySelector('.navbar .navbar-nav');
            if (nav) {
                btn = document.createElement('li');
                btn.className = 'nav-item';
                btn.innerHTML = `<a class="nav-link d-flex flex-column align-items-center" href="#" id="messagingNavBtn" style="color:#444;font-size:0.92rem;padding:6px 10px;border-radius:4px;"><i class="fas fa-comment-dots" style="font-size:1.3rem;margin-bottom:2px;"></i><span>Messaging</span></a>`;
                nav.appendChild(btn);
            }
        }
        document.getElementById('messagingNavBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openMessagingModal();
            setupMessagingForm();
        });
    }
    // 6. Close modal event
    function setupMessagingModalClose() {
        document.body.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'messagingClose') {
                closeMessagingModal();
            }
            if (e.target && e.target.id === 'messagingModal') {
                closeMessagingModal();
            }
        });
    }
    // --- INIT ---
    setupMessagingButton();
    setupMessagingModalClose();
    updateMessagingCount();

    // Set navbar profile photo
    const navbarUser = getCurrentUser && getCurrentUser();
    const navbarProfilePhoto = document.getElementById('navbarProfilePhoto');
    const navbarProfilePhotoLarge = document.getElementById('navbarProfilePhotoLarge');
    if (navbarUser) {
        if (navbarProfilePhoto) {
            navbarProfilePhoto.src = navbarUser.profile_photo || '/static/uploads/default-profile.png';
        }
        if (navbarProfilePhotoLarge) {
            navbarProfilePhotoLarge.src = navbarUser.profile_photo || '/static/uploads/default-profile.png';
        }
    }

    // --- Messaging unread count logic ---
    async function updateMessagingCount() {
        const token = localStorage.getItem('access_token');
        const badge = document.getElementById('messagingCount');
        if (!badge) return;
        try {
            // Fetch all messages for the current user (received only)
            const response = await fetch('/api/connections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load connections');
            const data = await response.json();
            let totalUnread = 0;
            // For each connection, fetch unread messages
            await Promise.all(data.connections.map(async (user) => {
                const res = await fetch(`/api/messages/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const msgData = await res.json();
                // Count messages where sender_id == user.id and not read (for now, assume all are unread)
                // You can add an 'is_read' field to Message model for real unread logic
                totalUnread += msgData.messages.filter(m => m.sender_id == user.id).length;
            }));
            if (totalUnread > 0) {
                badge.textContent = totalUnread;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        } catch (err) {
            badge.style.display = 'none';
        }
    }
    // Optionally, poll for new messages every 60 seconds
    setInterval(updateMessagingCount, 60000);

    // Set profile card image above connections (smaller, rounded)
    const sidebarProfileImg = document.querySelector('.card.mb-3 .rounded-circle.mx-auto');
    const sidebarUser = getCurrentUser && getCurrentUser();
    if (sidebarProfileImg && sidebarUser) {
        sidebarProfileImg.src = sidebarUser.profile_photo || '/static/uploads/default-profile.png';
    }

    // Add search functionality
    const searchForm = document.querySelector('form[role="search"]');
    const searchInput = searchForm.querySelector('input[type="search"]');
    
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/search/users?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            
            // Create and show search results modal
            showSearchResults(data.data.users);
        } catch (err) {
            console.error('Search error:', err);
            alert('Failed to perform search. Please try again.');
        }
    });

    function showSearchResults(users) {
        // Remove existing modal if any
        const existingModal = document.getElementById('searchResultsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'searchResultsModal';
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Search Results</h5>
                        <button type="button" class="btn-close" onclick="this.closest('#searchResultsModal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title mb-3">Filter Results</h6>
                                        <form id="filterForm" class="row g-3">
                                            <div class="col-md-4">
                                                <label class="form-label">Location</label>
                                                <input type="text" class="form-control" id="filterLocation" placeholder="e.g., New York">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Job Title</label>
                                                <input type="text" class="form-control" id="filterJobTitle" placeholder="e.g., Software Engineer">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">School</label>
                                                <input type="text" class="form-control" id="filterEducation" placeholder="e.g., Harvard University">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Company</label>
                                                <input type="text" class="form-control" id="filterExperience" placeholder="e.g., Google">
                                            </div>
                                            <div class="col-12">
                                                <button type="submit" class="btn btn-primary">Apply Filters</button>
                                                <button type="button" class="btn btn-outline-secondary ms-2" id="clearFiltersBtn">Clear Filters</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="searchResultsList">
                            ${users.length === 0 ? 
                                '<p class="text-center text-muted">No users found</p>' :
                                users.map(user => `
                                    <div class="d-flex align-items-center mb-3 p-2 border-bottom">
                                        <img src="${user.profile_photo || '/static/uploads/default-profile.png'}" 
                                             class="rounded-circle me-3" 
                                             style="width: 48px; height: 48px; object-fit: cover;">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-0">${user.first_name} ${user.last_name}</h6>
                                            <p class="text-muted mb-0">${user.job_title || ''}</p>
                                            <small class="text-muted">${user.location || ''}</small>
                                        </div>
                                        <button class="btn btn-outline-primary btn-sm view-profile-btn" 
                                                data-user-id="${user.id}">
                                            View Profile
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add click handlers for view profile buttons
        modal.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-user-id');
                window.location.href = `/components/FilteredProfile/FilteredProfile.html?id=${userId}`;
            });
        });

        // Add filter form submission handler
        const filterForm = modal.querySelector('#filterForm');
        filterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const location = document.getElementById('filterLocation').value.trim();
            const jobTitle = document.getElementById('filterJobTitle').value.trim();
            const education = document.getElementById('filterEducation').value.trim();
            const experience = document.getElementById('filterExperience').value.trim();
            const query = searchInput.value.trim();

            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Build query string with all filters
                const queryParams = new URLSearchParams();
                if (query) queryParams.append('query', query);
                if (location) queryParams.append('location', location);
                if (jobTitle) queryParams.append('job_title', jobTitle);
                if (education) queryParams.append('education', education);
                if (experience) queryParams.append('experience', experience);

                const response = await fetch(`/api/search/users?${queryParams.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Filter failed');
                }

                const data = await response.json();
                updateSearchResults(data.data.users);
            } catch (err) {
                console.error('Filter error:', err);
                alert('Failed to apply filters. Please try again.');
            }
        });

        // Add clear filters button handler
        const clearFiltersBtn = modal.querySelector('#clearFiltersBtn');
        clearFiltersBtn.addEventListener('click', () => {
            // Clear all filter inputs
            document.getElementById('filterLocation').value = '';
            document.getElementById('filterJobTitle').value = '';
            document.getElementById('filterEducation').value = '';
            document.getElementById('filterExperience').value = '';

            // Get the original search query
            const query = searchInput.value.trim();

            // Perform a new search with only the original query
            fetch(`/api/search/users?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                return response.json();
            })
            .then(data => {
                updateSearchResults(data.data.users);
            })
            .catch(err => {
                console.error('Search error:', err);
                alert('Failed to clear filters. Please try again.');
            });
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function updateSearchResults(users) {
        const resultsList = document.getElementById('searchResultsList');
        if (!resultsList) return;

        resultsList.innerHTML = users.length === 0 ? 
            '<p class="text-center text-muted">No users found</p>' :
            users.map(user => `
                <div class="d-flex align-items-center mb-3 p-2 border-bottom">
                    <img src="${user.profile_photo || '/static/uploads/default-profile.png'}" 
                         class="rounded-circle me-3" 
                         style="width: 48px; height: 48px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${user.first_name} ${user.last_name}</h6>
                        <p class="text-muted mb-0">${user.job_title || ''}</p>
                        <small class="text-muted">${user.location || ''}</small>
                    </div>
                    <button class="btn btn-outline-primary btn-sm view-profile-btn" 
                            data-user-id="${user.id}">
                        View Profile
                    </button>
                </div>
            `).join('');

        // Reattach click handlers for view profile buttons
        resultsList.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-user-id');
                window.location.href = `/components/FilteredProfile/FilteredProfile.html?id=${userId}`;
            });
        });
    }

    // 1. Make deleteComment function globally available
    window.deleteComment = async function(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/admin/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }
            // Remove the comment element from the DOM
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
                // Find the comments section container
                const commentsSection = commentElement.closest('.comments-section');
                if (commentsSection) {
                    // Get the post ID from the comments section ID
                    const postId = commentsSection.id.replace('comments-', '');
                    // Find the post's comment count element
                    const commentsCountElement = document.querySelector(`button.comment-btn[data-post-id="${postId}"] .comments-count`);
                    if (commentsCountElement) {
                        const currentCount = parseInt(commentsCountElement.textContent);
                        commentsCountElement.textContent = Math.max(0, currentCount - 1);
                    }
                }
                // Remove the comment element
                commentElement.remove();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete comment: ' + error.message);
        }
    };
}); 