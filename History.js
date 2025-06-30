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
const orderContainer = document.getElementById('orderContainer');
const searchInput = document.getElementById('searchInput');

if (!token) {
    showAlert("❌ Unauthorized access!", 'error');
    setTimeout(() => {
        window.location.href = "Login.html";
    }, 3000);
} else {
    // Role-based access control (similar to Home.js)
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

    // --- PREVENT BACK NAVIGATION (same as Home.js) ---
    function preventBackHistory() {
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, document.title, window.location.href);
        });
    }

    window.onload = preventBackHistory;
    setTimeout(preventBackHistory, 0);
    // --- END PREVENT BACK NAVIGATION ---
}

function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert');
    alertBox.classList.add(type);
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

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

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

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
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        window.history.replaceState(null, '', 'login.html');
        window.location.href = 'login.html';
    });
});

cancelLogoutButton.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
});

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

document.querySelector('.contact-button').addEventListener('click', () => {
    window.location.href = 'Contact.html';
});

document.querySelector('.feedback-button').addEventListener('click', () => {
    window.location.href = 'Feedback.html';
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = message;

    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.color = '#721c24';
    errorDiv.style.border = '1px solid #f5c6cb';
    errorDiv.style.padding = '10px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.opacity = '0';
    errorDiv.style.transition = 'opacity 0.5s ease-in-out';

    orderContainer.prepend(errorDiv);

    setTimeout(() => {
        errorDiv.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 500);
    }, 5000);
}

async function fetchOwnerAndOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Authentication token is missing.');
            return;
        }

        // 1. Fetch Owner's Data to get ownerId
        const ownerResponse = await fetch('http://localhost:5000/api/auth/profile', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!ownerResponse.ok) {
            const message = await ownerResponse.text();
            showError(`Could not fetch owner data: ${message || ownerResponse.statusText}`);
            return;
        }

        const ownerData = await ownerResponse.json();
        const ownerId = ownerData.ownerId;

        if (!ownerId) {
            showError('Owner ID not found.');
            return;
        }

        // 2. Fetch Order History
        const ordersResponse = await fetch(`http://localhost:5000/api/orders/history/${ownerId}`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!ordersResponse.ok) {
            const message = await ordersResponse.text();
            showError(`Could not fetch orders: ${message || ordersResponse.statusText}`);
            return;
        }

        const orders = await ordersResponse.json();
        if (orders.length === 0) {
            orderContainer.innerHTML = '<p>No order history found.</p>';
            return;
        }

        displayOrders(orders);

        // 3. Search Functionality
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredOrders = orders.filter(order =>
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.customerMobile.toLowerCase().includes(searchTerm) ||
                formatDate(order.orderTime).includes(searchTerm) // Search by formatted date
            );
            displayOrders(filteredOrders);
        });

    } catch (error) {
        console.error('Error:', error);
        showError('Could not fetch order history. Please try again.');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' };  // Indian time
    return date.toLocaleDateString('en-IN', options);
}

function displayOrders(orders) {
    orderContainer.innerHTML = ''; // Clear previous display
    orders.forEach(order => {
        const div = document.createElement('div');
        div.classList.add('order');
        let itemsList = order.items.map(item => `<p>- ${item.name} (Qty: ${item.quantity}, Price: ${item.price})</p>`).join('');

        div.innerHTML = `
            <p><strong>Table Number:</strong> ${order.tableNumber}</p>
            <p><strong>Customer Name:</strong> ${order.customerName}</p>
            <p><strong>Customer Mobile:</strong> ${order.customerMobile}</p>
            <p><strong>Order Time:</strong> ${formatDate(order.orderTime)}</p>
            <p><strong>Items:</strong></p>
            ${itemsList}
            <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
        `;
        orderContainer.appendChild(div);
    });
}

fetchOwnerAndOrders();