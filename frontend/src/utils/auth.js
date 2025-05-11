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