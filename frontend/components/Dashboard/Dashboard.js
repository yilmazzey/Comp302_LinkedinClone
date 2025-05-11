import { initProtectedPage, getCurrentUser } from '../../src/utils/auth';

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

    // Add any dashboard-specific functionality here
}); 