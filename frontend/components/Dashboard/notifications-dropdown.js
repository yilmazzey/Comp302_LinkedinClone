// notifications-dropdown.js

document.addEventListener('DOMContentLoaded', () => {
  const notificationBell = document.getElementById('notificationBell');
  const notificationList = document.getElementById('notificationList');
  const notificationCount = document.getElementById('notificationCount');

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      renderNotifications(data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  function renderNotifications(notifications) {
    notificationList.innerHTML = '';
    if (!notifications || notifications.length === 0) {
      notificationList.innerHTML = '<li class="dropdown-item text-center text-muted" style="font-family: Arial, sans-serif;">No new notifications</li>';
      notificationCount.style.display = 'none';
      return;
    }
    notificationCount.textContent = notifications.length;
    notificationCount.style.display = 'inline-block';
    notifications.forEach(n => {
      const li = document.createElement('li');
      li.className = 'dropdown-item notification-item';
      li.style.fontFamily = 'Arial, sans-serif';
      li.style.display = 'flex';
      li.style.flexDirection = 'column';
      li.style.alignItems = 'flex-start';
      li.style.gap = '6px';
      li.style.borderBottom = '1px solid #f0f0f0';
      li.style.padding = '12px 16px';
      li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: bold; color: #0a66c2;">${n.sender_name || 'System'}</span>
          <span style="color: #888; font-size: 0.85rem; margin-left: 8px;">${new Date(n.created_at).toLocaleString()}</span>
        </div>
        <div style="margin: 2px 0 4px 0; color: #222; font-size: 1rem;">${n.message}</div>
        <div class="notification-actions" style="display: flex; gap: 8px;">
          ${n.type === 'connection_request' ? `
            <button class="btn btn-sm btn-primary accept-btn" data-sender="${n.sender_id}" style="font-size:0.9rem;">Accept</button>
            <button class="btn btn-sm btn-danger reject-btn" data-sender="${n.sender_id}" style="font-size:0.9rem;">Reject</button>
          ` : ''}
          <button class="btn btn-link btn-sm mark-read-btn" data-id="${n.id}" style="color:#888; font-size:1.1rem;"><i class="fas fa-check"></i></button>
        </div>
      `;
      notificationList.appendChild(li);
    });
    // Add mark as read listeners
    notificationList.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        await markAsRead(id);
      });
    });
    // Add accept/reject listeners
    notificationList.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const senderId = btn.getAttribute('data-sender');
        await respondToConnection(senderId, 'accept');
      });
    });
    notificationList.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const senderId = btn.getAttribute('data-sender');
        await respondToConnection(senderId, 'reject');
      });
    });
  }

  async function markAsRead(id) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async function respondToConnection(senderId, action) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await fetch(`/api/connection-requests/${senderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      fetchNotifications();
    } catch (err) {
      console.error(`Error ${action}ing connection request:`, err);
    }
  }

  // Fetch notifications when dropdown is shown
  notificationBell.addEventListener('click', () => {
    fetchNotifications();
  });

  // Optionally, poll for new notifications every 60 seconds
  setInterval(fetchNotifications, 60000);
}); 