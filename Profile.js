const modal = document.getElementById("password-modal");
const changeBtn = document.getElementById("change-password-btn");
const closeBtn = document.querySelector(".close");
const submitBtn = document.getElementById("submit-password");

const nameField = document.getElementById("profile-name");
const emailField = document.getElementById("profile-email");
const idField = document.getElementById("profile-id");
const roleLabel = document.getElementById("role-label");

const token = localStorage.getItem("token");

// Fetch profile data
async function loadProfile() {
    try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
            headers: { Authorization: token }
        });

        const data = await res.json();

        console.log("Frontend Received:", data);

        if (res.ok) {
            nameField.textContent = data.name;
            emailField.textContent = data.email;

            if (data.role === 'owner') {
                idField.innerHTML = `
                     <b>Owner ID:</b> ${data.ownerId} <br><br>
                     <b>Restaurant Name:</b> ${data.restaurantName || 'N/A'} <br><br>
                     <b>No of Table:</b> ${data.noOfTables} <br><br>
                     <b>Role:</b> ${data.role}
                 `;
            } else if (data.role === 'employee') {
                idField.innerHTML = `
                     <b>Employee ID:</b> ${data.employeeId} <br><br>
                     <b>Mobile:</b> ${data.mobile || 'N/A'} <br><br>
                     <b>Age:</b> ${data.age || 'N/A'} <br><br>
                     <b>Address:</b> ${data.address || 'N/A'} <br><br>
                     <b>Role:</b> ${data.role} <br><br>
                     <b>Owner ID:</b> ${data.ownerId || 'Not Assigned'}
                 `;
            } else {
                idField.textContent = "User ID Unavailable";
                roleLabel.textContent = "Info:";
            }
        } else {
            alert("Failed to fetch profile");
        }
    } catch (err) {
        console.error("Error loading profile", err);
    }
}

//  Change password logic (unchanged)
submitBtn.addEventListener("click", async () => {
    const currentPassword = document.getElementById("current-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }


    if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match.");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.msg || "Password changed successfully.");
            modal.style.display = "none";

            // Optional: clear inputs
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-password").value = "";
        } else {
            alert(data.msg || "Failed to change password.");
        }
    } catch (err) {
        console.error("Password change error:", err);
        alert("An error occurred. Try again later.");
    }
});

changeBtn.onclick = () => {
    modal.style.display = "flex";
};

closeBtn.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

//home button action (unchanged)
const homeBtn = document.getElementById("home-btn");

const goToHome = () => {
    window.location.href = "Home.html";
};

if (homeBtn) {
    homeBtn.onclick = goToHome;
}

loadProfile();