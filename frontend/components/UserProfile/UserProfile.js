document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const user = JSON.parse(localStorage.getItem('user')) || {
        first_name: "John",
        last_name: "Doe",
        title: "Software Engineer",
        location: "San Francisco, CA",
        bio: "Experienced software engineer with a passion for creating innovative solutions.",
        profile_photo: "https://via.placeholder.com/150",
        connections: 500,
        experience: [
            { role: "Senior Developer", company: "Tech Corp", years: "2020 - Present" },
            { role: "Developer", company: "Web Solutions", years: "2017 - 2020" }
        ],
        education: [
            { school: "MIT", degree: "BSc Computer Science", years: "2013 - 2017" }
        ],
        posts: [
            { content: "Excited to join the LinkedIn Clone project!", date: "2024-06-01" },
            { content: "Just finished a great book on React.", date: "2024-05-20" }
        ]
    };

    // Set profile picture
    document.getElementById('profilePicture').src = user.profile_photo || "https://via.placeholder.com/150";

    // Set user info
    document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('userTitle').textContent = user.title || '';
    document.getElementById('userLocation').textContent = user.location || '';
    document.getElementById('connectionCount').textContent = `${user.connections}+ connections`;
    document.getElementById('userBio').textContent = user.bio || '';

    // Add event listener for the Edit Profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Edit Profile button clicked');
            window.location.href = 'http://127.0.0.1:5000/components/Profile/Profile.html';
        });
    }

    const backButton = document.getElementById('backToDashboardBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'http://127.0.0.1:5000/components/Dashboard/Dashboard.html';
    });
}


    // Render experience
    const experienceList = document.getElementById('experienceList');
    experienceList.innerHTML = '';
    (user.experience || []).forEach(exp => {
        const div = document.createElement('div');
        div.className = "mb-2";
        div.innerHTML = `<strong>${exp.role}</strong> at ${exp.company}<br><span class="text-muted">${exp.years}</span>`;
        experienceList.appendChild(div);
    });

    // Render education
    const educationList = document.getElementById('educationList');
    educationList.innerHTML = '';
    (user.education || []).forEach(edu => {
        const div = document.createElement('div');
        div.className = "mb-2";
        div.innerHTML = `<strong>${edu.school}</strong><br>${edu.degree}<br><span class="text-muted">${edu.years}</span>`;
        educationList.appendChild(div);
    });

    // Render posts
    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = '';
    (user.posts || []).forEach(post => {
        const card = document.createElement('div');
        card.className = "card mb-3";
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <img src="${user.profile_photo || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" style="width:40px; height:40px;">
                    <div>
                        <strong>${user.first_name} ${user.last_name}</strong><br>
                        <small>${post.date}</small>
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
        postsFeed.appendChild(card);
    });

    // Add Experience/Education (dummy handlers)
    document.getElementById('addExperienceBtn').addEventListener('click', () => {
        alert('Add Experience functionality coming soon!');
    });
    document.getElementById('addEducationBtn').addEventListener('click', () => {
        alert('Add Education functionality coming soon!');
    });
    document.getElementById('editPhotoBtn').addEventListener('click', () => {
        alert('Change Profile Photo functionality coming soon!');
    });
}); 