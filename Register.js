// Register.js

// Get the form element
const signupForm = document.getElementById('signupForm');
const notificationContainer = document.getElementById('notification-container');
const roleSelect = document.getElementById('role');
const employeeFieldsDiv = document.getElementById('employeeFields');
const ownerFieldsDiv = document.getElementById('ownerFields');

// Function to show/hide role-specific fields
function toggleRoleFields() {
    if (roleSelect.value === 'employee') {
        employeeFieldsDiv.style.display = 'block';
        ownerFieldsDiv.style.display = 'none';
    } else if (roleSelect.value === 'owner') {
        employeeFieldsDiv.style.display = 'none';
        ownerFieldsDiv.style.display = 'block';
    } else {
        employeeFieldsDiv.style.display = 'none';
        ownerFieldsDiv.style.display = 'none';
    }
}

// Initial call to set visibility on page load
toggleRoleFields();

// Add event listener to role select
roleSelect.addEventListener('change', toggleRoleFields);

// Add a submit event listener
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    // Owner specific field
    const restaurantName = role === 'owner' ? document.getElementById('restaurantName').value.trim() : null;
    const noOfTables = role === 'owner' ? document.getElementById('noOfTables').value.trim() : null;

    // Employee specific fields
    const mobile = role === 'employee' ? document.getElementById('mobile').value.trim() : null;
    const age = role === 'employee' ? document.getElementById('age').value.trim() : null;
    const address = role === 'employee' ? document.getElementById('address').value.trim() : null;

    // Email validation using regular expression
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailPattern.test(email);

    // Password validation
    const isPasswordValid =
        password.length >= 8 &&
        password.length <= 14 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^a-zA-Z0-9]/.test(password);

    // Mobile number validation (for employees)
    const isMobileValid = role !== 'employee' || (mobile && mobile.length === 10 && /^[0-9]{10}$/.test(mobile));

    const errors = [];

    if (!name || !email || !password || !role) {
        errors.push('Please fill out all fields.');
    }
    if (!isEmailValid) {
        errors.push('Please enter a valid email address.');
    }
    if (!email.includes('@')) {
        errors.push('Email must contain the "@" symbol.');
    }
    if (!email.includes('.')) {
        errors.push('Email must contain a "." symbol.');
    }
    if (!isPasswordValid) {
        errors.push('Password must be 8-14 characters with at least one number, uppercase, and special character.');
    }
    if (role === 'employee' && !isMobileValid) {
        errors.push('Please enter a valid 10-digit mobile number.');
    }
    if (role === 'owner' && !restaurantName) {
        errors.push('Please enter your restaurant name.');
    }
    if (role === 'owner' && !noOfTables) {
        errors.push('Please enter the number of tables.');
    }

    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'error');
        return;
    }

    let endpoint = "";
    let requestBody = { name, email, password };

    if (role === "owner") {
        endpoint = "http://localhost:5000/api/auth/register/owner";
        requestBody.restaurantName = restaurantName;
        requestBody.noOfTables = noOfTables;  // Include noOfTables in the request
    } else if (role === "employee") {
        endpoint = "http://localhost:5000/api/auth/register/employee";
        requestBody.mobile = mobile;
        requestBody.age = age;
        requestBody.address = address;
    } else {
        showAlert("❌ Invalid role selected.", 'error');
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            const userId = data.ownerId || data.employeeId;
            showIdAlert(`✅ Registration successful! Your ${role === 'owner' ? 'Restaurant' : 'Employee'} ID is: ${userId}`);
        } else {
            if (data.msg.includes("already registered")) {
                showAlert("❌ This email is already registered as an Owner or Employee. Use a different email.", 'error');
            } else {
                showAlert(data.msg || "❌ Registration failed. Please try again.", 'error');
            }
        }
    } catch (error) {
        showAlert("❌ Server error. Please try again later.", 'error');
    }
});

function showAlert(message, type, isId = false) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert');
    alertBox.classList.add(type);
    alertBox.innerHTML = message;
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

    if (isId) {
        alertBox.style.fontSize = '1.2em';
        alertBox.style.fontWeight = 'bold';
    }
}

function showIdAlert(message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
  <div class="modal-content">
  <p>${message}</p>
  <div class="modal-buttons">
  <button id="okButton">OK</button>
  </div>
  </div>
  `;
        notificationContainer.appendChild(modal);

        const okButton = modal.querySelector('#okButton');

        // Animation
        setTimeout(() => {
            modal.style.opacity = 1;
            modal.style.transform = 'translateY(0)';
        }, 10);

        okButton.addEventListener('click', () => {
            closeModal(modal);
            window.location.href = 'Login.html'; // Redirect here
            resolve();
        });
    });
}

function closeModal(modal) {
    modal.style.opacity = 0;
    modal.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        modal.remove();
    }, 500);
}