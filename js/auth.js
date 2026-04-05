// ===== auth.js — Real API Auth =====

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('registerTab').classList.toggle('active', !isLogin);
    document.getElementById('tabIndicator').style.transform = isLogin ? 'translateX(0)' : 'translateX(100%)';
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = `<i class="fas fa-eye${isText ? '' : '-slash'}"></i>`;
}

// Password strength
const regPw = document.getElementById('regPassword');
if (regPw) {
    regPw.addEventListener('input', function () {
        const v = this.value;
        let s = 0;
        if (v.length >= 6) s++;
        if (v.length >= 10) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        const colors = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        document.getElementById('pwBar').style.cssText = `width:${s * 20}%;background:${colors[s]}`;
        const lbl = document.getElementById('pwLabel');
        lbl.textContent = v.length ? labels[s] : '';
        lbl.style.color = colors[s];
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = document.getElementById('loginBtn');
    const errEl    = document.getElementById('loginError');

    errEl.textContent = '';
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;

    try {
        await apiLogin(email, password);
        goTo('dashboard');
    } catch (err) {
        errEl.textContent = err.message;
        btn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const firstName  = document.getElementById('regFirstName').value.trim();
    const lastName   = document.getElementById('regLastName').value.trim();
    const email      = document.getElementById('regEmail').value.trim();
    const role       = document.getElementById('regRole').value;
    const studentId  = document.getElementById('regStudentId')?.value.trim() || '';
    const employeeId = document.getElementById('regEmployeeId')?.value.trim() || '';
    const password   = document.getElementById('regPassword').value;
    const confirm    = document.getElementById('regConfirm').value;
    const btn        = document.getElementById('registerBtn');
    const errEl      = document.getElementById('registerError');

    errEl.textContent = '';
    document.getElementById('regEmailErr').textContent = '';
    document.getElementById('regConfirmErr').textContent = '';

    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if (password !== confirm) { document.getElementById('regConfirmErr').textContent = 'Passwords do not match.'; return; }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;

    try {
        await apiRegister({ firstName, lastName, email, password, role, studentId, employeeId });
        goTo('dashboard');
    } catch (err) {
        if (err.message.toLowerCase().includes('email')) {
            document.getElementById('regEmailErr').textContent = err.message;
        } else {
            errEl.textContent = err.message;
        }
        btn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
        btn.disabled = false;
    }
}

function updateRegisterFields() {
    const role = document.getElementById('regRole')?.value || 'student';
    const studentWrap  = document.getElementById('studentIdWrap');
    const employeeWrap = document.getElementById('employeeIdWrap');
    if (!studentWrap || !employeeWrap) return;
    const isStudent = role === 'student';
    studentWrap.style.display  = isStudent ? 'block' : 'none';
    employeeWrap.style.display = isStudent ? 'none' : 'block';
    document.getElementById('regStudentId').required  = isStudent;
    document.getElementById('regEmployeeId').required = !isStudent;
}

async function loginDemo(role) {
    const demos = {
        student: { email: 'student@college.edu',    password: 'demo123' },
        staff:   { email: 'staff@printease.local',  password: 'demo123' },
        admin:   { email: 'owner@printease.local',  password: 'demo123' }
    };

    const btn = document.querySelector(`[onclick="loginDemo('${role}')"]`);
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

    try {
        await apiLogin(demos[role].email, demos[role].password);
        goTo('dashboard');
    } catch {
        // Demo user doesn't exist yet — register them first
        const names = { student: ['Rahul', 'Sharma', 'MIT2024001', ''], staff: ['Kiran', 'Das', '', 'STF-014'], admin: ['Asha', 'Patel', '', 'OWN-001'] };
        const [firstName, lastName, studentId, employeeId] = names[role];
        try {
            await apiRegister({ firstName, lastName, email: demos[role].email, password: demos[role].password, role, studentId, employeeId });
            goTo('dashboard');
        } catch (err) {
            showToast('Demo login failed: ' + err.message, 'error');
            if (btn) { btn.innerHTML = `<i class="fas fa-user"></i> Demo ${role}`; btn.disabled = false; }
        }
    }
}

document.getElementById('regRole')?.addEventListener('change', updateRegisterFields);
updateRegisterFields();
