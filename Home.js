const navbar = document.querySelector('.navbar');
const sideMenu = document.querySelector('.side-menu');
const menuIcon = document.querySelector('.menu-icon');
const overlay = document.querySelector('.overlay');
const main = document.querySelector('main');
const logout = document.getElementById('logout');
const notificationContainer = document.getElementById('notification-container');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmLogoutButton = document.getElementById('confirm-logout');
const cancelLogoutButton = document.getElementById('cancel-logout');
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token) {
    showAlert("❌ Unauthorized access!", 'error');
    setTimeout(() => {
        window.location.href = "Login.html";
    }, 3000);
} else {
    // Role-based access control
    if (role === 'employee') {
        // Hide navbar links except Home and Take Order
        Array.from(navbar.children).forEach(link => {
            if (
                link.textContent !== 'Home' &&
                link.textContent !== 'Take Order' &&
                !link.classList.contains('menu-icon')
            ) {
                link.style.display = 'none';
            }
        });

        // Show only Profile and Logout in side menu, but keep it accessible
        Array.from(sideMenu.children).forEach(item => {
            if (item.textContent !== 'Profile' && item.textContent !== 'Logout') {
                item.style.display = 'none';
            }
        });
    }

    // --- PREVENT BACK NAVIGATION ---
    function preventBackHistory() {
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, document.title, window.location.href);
        });
    }

    window.onload = preventBackHistory;
    // Call it again, just to be sure (handles some edge cases)
    setTimeout(preventBackHistory, 0);
    // --- END PREVENT BACK NAVIGATION ---
}

function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert');
    alertBox.classList.add(type);
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    // Basic animation
    setTimeout(() => {
        alertBox.style.opacity = 1;
        alertBox.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        alertBox.style.opacity = 0;
        alertBox.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            alertBox.remove();
        }, 500);
    }, 3000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.classList.add(type);
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove notification after a delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

logout.addEventListener('click', () => {
    confirmationModal.style.display = 'flex';
});

confirmLogoutButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    showNotification('You have been logged out!', 'success');
    setTimeout(() => {
        localStorage.removeItem('token'); // Clear token
        localStorage.removeItem('userId'); // Clear user ID
        localStorage.removeItem('role');  // Clear role
        // window.history.replaceState(null, '', 'Login.html'); // Replace current history entry
        window.location.href = 'Login.html';
    });
});

cancelLogoutButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
});

// Sidebar menu functionality
menuIcon.addEventListener('click', () => {
    sideMenu.style.width = '250px';
    overlay.classList.add('active');
    main.classList.add('blur');
});

overlay.addEventListener('click', () => {
    sideMenu.style.width = '0';
    overlay.classList.remove('active');
    main.classList.remove('blur');
});

// Contact Us button functionality
document.querySelector('.contact-button').addEventListener('click', () => {
    window.location.href = 'Contact.html';
});

// Feedback button functionality
document.querySelector('.feedback-button').addEventListener('click', () => {
    window.location.href = 'Feedback.html';
});