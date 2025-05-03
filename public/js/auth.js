const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const errorDiv = document.getElementById("signup-error");

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            container.classList.remove("right-panel-active");
        } else {
            errorDiv.textContent = data.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "An error occurred. Please try again.";
        errorDiv.style.display = "block";
    }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            window.location.href = "chatUI2.html";
        } else {
            errorDiv.textContent = data.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "An error occurred. Please try again.";
        errorDiv.style.display = "block";
    }
});