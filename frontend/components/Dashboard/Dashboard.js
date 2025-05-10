export function renderDashboard(container, onLogout) {
  loadComponentCSS('components/Dashboard/Dashboard.css');
  fetch('components/Dashboard/Dashboard.html')
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
      const logoutBtn = container.querySelector('#closed');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          onLogout();
        });
      }
    });
}

function loadComponentCSS(href) {
  if (![...document.styleSheets].some(s => s.href && s.href.includes(href))) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
} 