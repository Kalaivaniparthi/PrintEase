// ===== auth.js =====

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const indicator = document.getElementById('tabIndicator');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        indicator.style.transform = 'translateX(0)';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        indicator.style.transform = 'translateX(100%)';
    }
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = `<i class="fas fa-eye${isText ? '' : '-slash'}"></i>`;
}

const regPw = document.getElementById('regPassword');
if (regPw) {
    regPw.addEventListener('input', function () {
        const value = this.value;
        let strength = 0;
        if (value.length >= 6) strength++;
        if (value.length >= 10) strength++;
        if (/[A-Z]/.test(value)) strength++;
        if (/[0-9]/.test(value)) strength++;
        if (/[^A-Za-z0-9]/.test(value)) strength++;

        const bar = document.getElementById('pwBar');
        const label = document.getElementById('pwLabel');
        const colors = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        bar.style.width = `${strength * 20}%`;
        bar.style.background = colors[strength];
        label.textContent = value.length ? labels[strength] : '';
        label.style.color = colors[strength];
    });
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    errEl.textContent = '';
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;

    setTimeout(() => {
        const user = getUsers().find(item => item.email.toLowerCase() === email && item.password === password);

        if (!user) {
            errEl.textContent = 'Invalid email or password. Please try again.';
            btn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
            return;
        }

        setUserSession(user);
        goTo('dashboard');
    }, 500);
}

function handleRegister(event) {
    event.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const role = document.getElementById('regRole').value;
    const studentId = document.getElementById('regStudentId').value.trim();
    const employeeId = document.getElementById('regEmployeeId').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const btn = document.getElementById('registerBtn');
    const errEl = document.getElementById('registerError');

    errEl.textContent = '';
    document.getElementById('regEmailErr').textContent = '';
    document.getElementById('regConfirmErr').textContent = '';

    if (password.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        return;
    }
    if (password !== confirm) {
        document.getElementById('regConfirmErr').textContent = 'Passwords do not match.';
        return;
    }
    if (role === 'student' && !studentId) {
        errEl.textContent = 'Student ID is required for student accounts.';
        return;
    }
    if ((role === 'admin' || role === 'staff') && !employeeId) {
        errEl.textContent = 'Employee ID is required for admin and staff accounts.';
        return;
    }

    const users = getUsers();
    if (users.find(user => user.email.toLowerCase() === email)) {
        document.getElementById('regEmailErr').textContent = 'An account with this email already exists.';
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;

    setTimeout(() => {
        const newUser = {
            firstName,
            lastName,
            email,
            role,
            studentId: role === 'student' ? studentId : '',
            employeeId: role === 'student' ? '' : employeeId,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setUserSession(newUser);
        goTo('dashboard');
    }, 600);
}

function updateRegisterFields() {
    const role = document.getElementById('regRole')?.value || 'student';
    const studentWrap = document.getElementById('studentIdWrap');
    const employeeWrap = document.getElementById('employeeIdWrap');
    const studentInput = document.getElementById('regStudentId');
    const employeeInput = document.getElementById('regEmployeeId');

    if (!studentWrap || !employeeWrap) return;

    const isStudent = role === 'student';
    studentWrap.style.display = isStudent ? 'grid' : 'none';
    employeeWrap.style.display = isStudent ? 'none' : 'grid';
    studentInput.required = isStudent;
    employeeInput.required = !isStudent;
}

function loginDemo(role) {
    const demoUsers = {
        admin: {
            firstName: 'Asha',
            lastName: 'Patel',
            email: 'owner@printease.local',
            employeeId: 'OWN-001',
            role: 'admin',
            password: 'demo123'
        },
        staff: {
            firstName: 'Kiran',
            lastName: 'Das',
            email: 'staff@printease.local',
            employeeId: 'STF-014',
            role: 'staff',
            password: 'demo123'
        },
        student: {
            firstName: 'Rahul',
            lastName: 'Sharma',
            email: 'student@college.edu',
            studentId: 'MIT2024001',
            role: 'student',
            password: 'demo123'
        }
    };

    const users = getUsers();
    let demo = users.find(user => user.email === demoUsers[role].email);
    if (!demo) {
        demo = { ...demoUsers[role], createdAt: new Date().toISOString() };
        users.push(demo);
        saveUsers(users);
    }

    setUserSession(demo);
    goTo('dashboard');
}

document.getElementById('regRole')?.addEventListener('change', updateRegisterFields);
updateRegisterFields();
