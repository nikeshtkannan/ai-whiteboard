// Function to validate login form
function validateLogin() {
    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    if (username === "" || password === "") {
        alert("Please fill in all fields.");
        return false;
    }

    return true;
}

// Function to handle login form submission
async function submitLoginForm(e) {
    e.preventDefault(); // Prevent default form submission

    if (validateLogin()) {
        // Get form data
        const username = document.querySelector('input[type="text"]').value;
        const password = document.querySelector('input[type="password"]').value;

        // Prepare data to send to the server
        const data = { username, password };

        try {
            // Send POST request to the /login endpoint
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // If login is successful, store login state in localStorage
                localStorage.setItem("loggedIn", "true");
                alert(result.message); // Login successful
                window.location.href = result.redirect || "/home.html"; // Redirect to home page or whiteboard
            } else {
                alert(result.message); // Show error message (e.g., "Invalid username or password")
            }
        } catch (error) {
            alert("An error occurred during login. Please try again.");
        }
    }
}

// Attach event listener to the login form on page load
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".main form"); // Adjust selector for your structure
    if (loginForm) {
        loginForm.addEventListener('submit', submitLoginForm);
    }
});

// Forgot Password Form Submission
async function handleForgotPassword(event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    const username = document.querySelector('input[placeholder="Username"]').value;
    const email = document.querySelector('input[placeholder="Enter Email"]').value;

    if (!username || !email) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message); // Example: "Reset link sent to your email."
        } else {
            alert(result.message); // Example: "User not found."
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
}

// Attach event listener for the forgot password form
document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.querySelector("form"); // Make sure it selects the correct form
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
});
