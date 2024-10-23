// Function to validate registration form
function validateRegistration() {
    const email = document.querySelector('input[type="email"]').value;
    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelectorAll('input[type="password"]');
    const password1 = password[0].value;
    const password2 = password[1].value;

    if (email === "" || username === "" || password1 === "" || password2 === "") {
        alert("Please fill in all fields.");
        return false;
    }

    if (password1 !== password2) {
        alert("Passwords do not match.");
        return false;
    }

    // If validation passes, return true
    return true;
}

// Function to handle registration form submission
async function submitRegistrationForm(e) {
    e.preventDefault(); // Prevent default form submission

    if (validateRegistration()) {
        // Get form data
        const email = document.querySelector('input[type="email"]').value;
        const username = document.querySelector('input[type="text"]').value;
        const password = document.querySelector('input[type="password"]').value;

        // Prepare the data to send to the server
        const data = { username, email, password };

        try {
            // Send POST request to the /register endpoint
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message); // Registration successful
                window.location.href = '/login'; // Redirect to login page after success
            } else {
                alert(result.message); // Show error message
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        }
    }
}

// Attach event listener to the registration form on page load
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector(".main form"); // Adjust selector for your structure
    if (registerForm) {
        registerForm.addEventListener('submit', submitRegistrationForm);
    }
});
