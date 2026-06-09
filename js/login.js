// ── login.js ──
import { getUsers, setSession, toast, initDarkMode } from './auth.js';

initDarkMode('darkToggle');

const form  = document.getElementById('loginForm');
const errEl = document.getElementById('loginError');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errEl.classList.remove('show');

  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);

  if (!user) {
    errEl.textContent = 'Invalid email or password.';
    errEl.classList.add('show');
    form.style.animation = 'none';
    requestAnimationFrame(() => { form.style.animation = ''; });
    return;
  }

  setSession(user);
  toast(`Welcome back, ${user.fullName}!`, 'success');

  setTimeout(() => {
    window.location.href = user.role === 'owner'
      ? './owner-dashboard.html'
      : user.role === 'staff'
        ? './staff-dashboard.html'
        : './student-dashboard.html';
  }, 600);
});
