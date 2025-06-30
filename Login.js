document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const notificationContainer = document.getElementById('notification-container'); // Get the container

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);

            showAlert("✅ Login successful!", 'success');

            // Delay the redirection
            setTimeout(() => {
                fetchUserRole();
            }, 1000); // Redirect after 2 seconds
        } else {
            showAlert(data.msg, 'error');
        }
    } catch (error) {
        showAlert("❌ Login failed. Please try again.", 'error');
    }

    function showAlert(message, type) {
        const alertBox = document.createElement('div');
        alertBox.classList.add('alert');
        alertBox.classList.add(type);
        alertBox.textContent = message;
        notificationContainer.appendChild(alertBox);

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
});

// 📌 Function to Fetch Role from Backend
async function fetchUserRole() {
    const token = localStorage.getItem("token");
    const notificationContainer = document.getElementById('notification-container'); // Get the container

    if (!token) {
        showAlert("❌ Unauthorized access!", 'error');
        setTimeout(() => {
            window.location.href = "Login.html";
        }, 3500);
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('role', data.role);
            window.location.href = "Home.html"; // Redirect to Home
        } else {
            showAlert("❌ Failed to fetch user role.", 'error');
            setTimeout(() => {
                window.location.href = "Login.html";
            }, 3500);
        }
    } catch (error) {
        showAlert("❌ Error fetching user role.", 'error');
        setTimeout(() => {
            window.location.href = "Login.html";
        }, 3500);
    }

    function showAlert(message, type) {
        const alertBox = document.createElement('div');
        alertBox.classList.add('alert');
        alertBox.classList.add(type);
        alertBox.textContent = message;
        notificationContainer.appendChild(alertBox);

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
}

// --  PREVENT GOING BACK TO HOME PAGE AFTER LOGOUT --
if (localStorage.getItem('token')) {
    window.history.replaceState(null, '', 'Login.html'); // Corrected line
    window.location.href = 'Home.html';
}
// --  END PREVENT GOING BACK TO HOME PAGE AFTER LOGOUT  --