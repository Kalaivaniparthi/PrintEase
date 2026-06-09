// ── signup.js ──
import { getUsers, saveUsers, setSession, toast, initDarkMode } from './auth.js';

initDarkMode('darkToggle');

const form  = document.getElementById('signupForm');
const errEl = document.getElementById('signupError');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errEl.classList.remove('show');

  const fullName  = document.getElementById('fullName').value.trim();
  const email     = document.getElementById('email').value.trim().toLowerCase();
  const password  = document.getElementById('password').value;
  const confirm   = document.getElementById('confirmPassword').value;
  const role      = document.getElementById('role').value;

  if (!fullName || fullName.length < 2) return showErr('Full name must be at least 2 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email))    return showErr('Enter a valid email address.');
  if (password.length < 6)              return showErr('Password must be at least 6 characters.');
  if (password !== confirm)             return showErr('Passwords do not match.');

  const users = getUsers();
  if (users.find(u => u.email === email)) return showErr('An account with this email already exists.');

  const user = {
    id: crypto.randomUUID(),
    fullName, email, password, role,
    phone: '', college: '',
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  setSession(user);

  toast('Account created! Redirecting…', 'success');
  setTimeout(() => {
    window.location.href = role === 'owner'
      ? './owner-dashboard.html'
      : role === 'staff'
        ? './staff-dashboard.html'
        : './student-dashboard.html';
  }, 800);
});

function showErr(msg) {
  errEl.textContent = msg;
  errEl.classList.add('show');
}
