// ============================================
// OCEAN GUARD - JavaScript Functionality
// ============================================

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================
// LOGIN MODAL FUNCTIONALITY
// ============================================

function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.toggle('show');
    if (modal.classList.contains('show')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.login-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function doLogin(username, password, expectedRole) {
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.role === 'admin') {
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/admin', 1000);
        } else if (data.role === 'fisher') {
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/fisher', 1000);
        } else {
            showMessage('Invalid username or password', 'error');
        }
    })
    .catch(() => showMessage('Login failed. Please try again.', 'error'));
}

function handleAdminLogin(e) {
    e.preventDefault();
    doLogin(document.getElementById('adminUsername').value,
            document.getElementById('adminPassword').value);
}

function handleFisherLogin(e) {
    e.preventDefault();
    doLogin(document.getElementById('fisherUsername').value,
            document.getElementById('fisherPassword').value);
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        ${type === 'success' ? 'background: #28a745; color: white;' : 'background: #dc3544; color: white;'}
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        toggleLoginModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('loginModal');
        if (modal.classList.contains('show')) {
            toggleLoginModal();
        }
    }
});

// ============================================
// ANIMATED COUNTERS
// ============================================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16); // 16ms per frame (60fps)
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        current = Math.floor(target * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }
    
    update();
}

// Intersection Observer for triggering animations when in view
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.animated) {
            const target = parseInt(entry.target.dataset.target);
            animateCounter(entry.target, target);
            entry.target.animated = true;
        }
    });
}, observerOptions);

// Observe all stat values
document.querySelectorAll('.stat-value').forEach(el => {
    observer.observe(el);
});

// ============================================
// NAVIGATION HIGHLIGHTING
// ============================================

const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// HERO ANIMATION ON LOAD
// ============================================

window.addEventListener('load', function() {
    setTimeout(() => {
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.opacity = '1';
        }
    }, 100);
});

// ============================================
// LAZY LOADING FOR CARDS
// ============================================

const cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '50px'
});

document.querySelectorAll('.layer-card, .about-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    cardObserver.observe(card);
});

// ============================================
// PARALLAX EFFECT (Optional Enhancement)
// ============================================

window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < hero.offsetHeight) {
        hero.style.backgroundPosition = `center ${scrolled * 0.5}px`;
    }
});

// ============================================
// MOBILE MENU SUPPORT
// ============================================

// Add touch-friendly interactions
if ('ontouchstart' in window) {
    document.querySelectorAll('.layer-card, .stat-card, .about-card').forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.opacity = '1';
        });
    });
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// DEMO: DYNAMIC STATS UPDATE
// ============================================

// Simulate live stats updates every 10 seconds
setInterval(function() {
    // This would be connected to a real API in production
    // For now, it's just a placeholder for future enhancement
}, 10000);

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Add keyboard navigation for modals
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('loginModal');
    if (modal && modal.classList.contains('show')) {
        if (event.key === 'Tab') {
            // Allow Tab navigation within modal
            const focusableElements = modal.querySelectorAll('input, button, [tabindex]');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        }
    }
});

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌊 Ocean Guard Dashboard initialized successfully!');
    console.log('Demo Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Fisher: fisheries / fisheries123');
});
