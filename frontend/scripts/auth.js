// Basic auth utility
function getToken() {
    return localStorage.getItem('access_token');
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/login';
    }
}

// Call checkAuth on page load
checkAuth(); 