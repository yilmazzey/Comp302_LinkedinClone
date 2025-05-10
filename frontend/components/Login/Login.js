export function renderLogin(container, onLoginSuccess) {
  loadComponentCSS('components/Login/Login.css');
  fetch('components/Login/Login.html')
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
      const loginBtn = container.querySelector('.btn1 button');
      loginBtn.addEventListener('click', function () {
        onLoginSuccess();
      });
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

function errorAler(container, message) {
  var alert = `<div id='linker' class='invalid-feedback' style="color:red">${message}</div>`;
  const inp = container.querySelector('.inp');
  inp.classList.add('form-control', 'is-invalid');
  const dıv = container.querySelector('.denım');
  dıv.insertAdjacentHTML('beforeend', alert);
  setTimeout(() => { const el = container.querySelector('.invalid-feedback'); if (el) el.remove(); }, 3000);
  setTimeout(() => { inp.setAttribute('class', 'form-control'); }, 3000);
}

function errorPasword(container, message) {
  var alert = `<div id='linkps' class='invalid-feedback' style="color:red">${message}</div>`;
  const input = container.querySelector('.inps');
  input.classList.add('form-control', 'is-invalid');
  const dıv1 = container.querySelector('.denps');
  dıv1.insertAdjacentHTML('beforeend', alert);
  setTimeout(() => { const el = container.querySelector('.invalid-feedback'); if (el) el.remove(); }, 3000);
  setTimeout(() => { input.setAttribute('class', 'form-control'); }, 3000);
} 