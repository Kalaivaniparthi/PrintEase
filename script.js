// ===== script.js =====
console.log('📱 PrintEase JavaScript loaded!');

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ App ready!');
    
    // Make all buttons clickable
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            alert('🖨️ Feature working! JavaScript is active.');
        });
    });
    
    // Add hover effects to action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
            this.style.transform = 'translateY(-8px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            this.style.transform = 'translateY(0)';
        });
    });
    
    // QR Code functionality
    document.querySelectorAll('.pickup-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const orderId = this.closest('.order-card').querySelector('.order-id').textContent;
            alert(`📱 QR Code for ${orderId}:\n\nShow this at Xerox shop!`);
        });
    });
    
    // Payment simulation
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('💳 Complete payment for this order?')) {
                this.textContent = '✅ Paid';
                this.style.background = '#10b981';
                alert('Payment successful! Order will be printed.');
            }
        });
    });
    
    // Track order buttons
    document.querySelectorAll('.track-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('📦 Order is being printed. Estimated time: 10 minutes.');
        });
    });
    
    // Navigation active state
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
    
    console.log('🎯 All JavaScript features loaded!');
});

// Simple notification function
function showNotification(message, type = 'info') {
    console.log(`📢 Notification: ${message}`);
    // You'll add popup notifications later
}