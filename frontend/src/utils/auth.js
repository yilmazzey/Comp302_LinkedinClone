import api from './axios';

export const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/components/Login/Login.html';
        return false;
    }
    return true;
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/components/Login/Login.html';
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Add this to any protected page's script
export const initProtectedPage = () => {
    if (!checkAuth()) return;
    
    // Add logout functionality if there's a logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
};

// Function to check if user is authenticated
export function isAuthenticated() {
    return localStorage.getItem('access_token') !== null;
}

// Function to get current user
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Function to initialize protected page
export function initProtectedPage() {
    if (!isAuthenticated()) {
        window.location.href = '/';
        return;
    }

    // Set up logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }

    // Update user information in the UI
    const user = getCurrentUser();
    if (user) {
        const userNameElements = document.querySelectorAll('#userName, #sidebarUserName');
        const userTitleElements = document.querySelectorAll('#userTitle, #sidebarUserTitle');
        
        userNameElements.forEach(el => {
            if (el) el.textContent = `${user.first_name} ${user.last_name}`;
        });
        
        userTitleElements.forEach(el => {
            if (el) el.textContent = user.title || 'Member';
        });
    }
} 