import api from '../../src/utils/axios';

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            tabContents.forEach(tc => tc.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            loadTabContent(tab);
        });
    });

    function loadTabContent(tabId) {
        if (tabId === 'connections') {
            loadConnections(document.querySelector('#connections .connections-list'));
        } else if (tabId === 'requests') {
            loadConnectionRequests(document.querySelector('#requests .requests-list'));
        } else if (tabId === 'suggestions') {
            loadSuggestedConnections(document.querySelector('#suggestions .suggestions-list'));
        }
    }

    // Initial load
    loadTabContent('connections');

    async function loadConnections(container) {
        try {
            const response = await api.get('/connections');
            const data = response.data;
            if (data.connections.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>You haven't connected with anyone yet.</p><p>Check out suggested connections to start building your network!</p></div>`;
                return;
            }
            container.innerHTML = data.connections.map(user => `
                <div class="connection-card">
                    <img src="${user.profile_photo || '/static/default-profile.png'}" alt="${user.first_name}" class="connection-photo">
                    <div class="connection-info">
                        <div class="connection-name">${user.first_name} ${user.last_name}</div>
                        <div class="connection-title">${user.job_title || 'No job title'}</div>
                        <div class="connection-location">${user.location || 'No location'}</div>
                    </div>
                    <div class="connection-actions">
                        <button class="btn btn-primary view-profile-btn" data-user-id="${user.id}">View Profile</button>
                        <button class="btn btn-secondary message-user-btn" data-user-id="${user.id}">Message</button>
                    </div>
                </div>
            `).join('');
            attachConnectionListeners(container);
        } catch (error) {
            console.error('Error loading connections:', error);
            container.innerHTML = `<div class="empty-state"><p>Error loading content. Please try again later.</p></div>`;
        }
    }

    async function loadConnectionRequests(container) {
        try {
            const response = await api.get('/connection-requests');
            const data = response.data;
            if (data.connection_requests.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>No pending connection requests</p></div>`;
                return;
            }
            container.innerHTML = data.connection_requests.map(user => `
                <div class="connection-card">
                    <img src="${user.profile_photo || '/static/default-profile.png'}" alt="${user.first_name}" class="connection-photo">
                    <div class="connection-info">
                        <div class="connection-name">${user.first_name} ${user.last_name}</div>
                        <div class="connection-title">${user.job_title || 'No job title'}</div>
                        <div class="connection-location">${user.location || 'No location'}</div>
                    </div>
                    <div class="connection-actions">
                        <button class="btn btn-primary accept-connection-btn" data-user-id="${user.id}">Accept</button>
                        <button class="btn btn-danger reject-connection-btn" data-user-id="${user.id}">Reject</button>
                    </div>
                </div>
            `).join('');
            attachRequestListeners(container);
        } catch (error) {
            console.error('Error loading connection requests:', error);
            container.innerHTML = `<div class="empty-state"><p>Error loading content. Please try again later.</p></div>`;
        }
    }

    async function loadSuggestedConnections(container) {
        try {
            const response = await api.get('/suggested-connections');
            const data = response.data;
            if (data.suggested_connections.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-user-friends"></i><p>No suggested connections at the moment</p></div>`;
                return;
            }
            container.innerHTML = data.suggested_connections.map(user => `
                <div class="connection-card">
                    <img src="${user.profile_photo || '/static/default-profile.png'}" alt="${user.first_name}" class="connection-photo">
                    <div class="connection-info">
                        <div class="connection-name">${user.first_name} ${user.last_name}</div>
                        <div class="connection-title">${user.job_title || 'No job title'}</div>
                        <div class="connection-location">${user.location || 'No location'}</div>
                    </div>
                    <div class="connection-actions">
                        <button class="btn btn-primary connect-btn" data-user-id="${user.id}">Connect</button>
                        <button class="btn btn-secondary view-profile-btn" data-user-id="${user.id}">View Profile</button>
                    </div>
                </div>
            `).join('');
            attachSuggestionListeners(container);
        } catch (error) {
            console.error('Error loading suggested connections:', error);
            container.innerHTML = `<div class="empty-state"><p>Error loading content. Please try again later.</p></div>`;
        }
    }

    // Attach event listeners for connections tab
    function attachConnectionListeners(container) {
        container.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                viewProfile(userId);
            });
        });
        container.querySelectorAll('.message-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                messageUser(userId);
            });
        });
    }

    // Attach event listeners for requests tab
    function attachRequestListeners(container) {
        container.querySelectorAll('.accept-connection-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = btn.getAttribute('data-user-id');
                await acceptConnection(userId);
            });
        });
        container.querySelectorAll('.reject-connection-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = btn.getAttribute('data-user-id');
                await rejectConnection(userId);
            });
        });
    }

    // Attach event listeners for suggestions tab
    function attachSuggestionListeners(container) {
        container.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = btn.getAttribute('data-user-id');
                await connect(userId);
            });
        });
        container.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                viewProfile(userId);
            });
        });
    }

    // API actions
    async function connect(userId) {
        try {
            await api.post(`/connect/${userId}`);
            loadTabContent('suggestions');
        } catch (error) {
            console.error('Error sending connection request:', error);
            alert('Failed to send connection request. Please try again.');
        }
    }

    async function acceptConnection(userId) {
        try {
            await api.put(`/connection-requests/${userId}`, { action: 'accept' });
            loadTabContent('requests');
            loadTabContent('connections');
        } catch (error) {
            console.error('Error accepting connection request:', error);
            alert('Failed to accept connection request. Please try again.');
        }
    }

    async function rejectConnection(userId) {
        try {
            await api.put(`/connection-requests/${userId}`, { action: 'reject' });
            loadTabContent('requests');
        } catch (error) {
            console.error('Error rejecting connection request:', error);
            alert('Failed to reject connection request. Please try again.');
        }
    }

    function viewProfile(userId) {
        window.location.href = `/userprofile?id=${userId}`;
    }

    function messageUser(userId) {
        alert('Messaging feature coming soon!');
    }
}); 