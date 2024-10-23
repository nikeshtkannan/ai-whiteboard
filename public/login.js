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
