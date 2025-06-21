// Schimbă între formulare
function showRegister() {
    document.getElementById("login-tab").classList.remove("active");
    document.getElementById("register-tab").classList.add("active");
}

function showLogin() {
    document.getElementById("register-tab").classList.remove("active");
    document.getElementById("login-tab").classList.add("active");
}

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("error");

    try {
        const response = await fetch("/Kim/api/users/auth.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (data.success) {
            if (data.role === "admin") {
               window.location.href = "/Kim/index.php?page=admin";
            } else if (data.role === "parent") {
               window.location.href = "/Kim/index.php?page=parent";
            } else {
                errorBox.textContent = "Rol necunoscut.";
            }
        } else {
            errorBox.textContent = data.message || "Eroare la autentificare.";
            errorBox.style.color = "#ff5c5c";
        }
    } catch (err) {
        errorBox.textContent = "Eroare server!";
        errorBox.style.color = "#ff5c5c";
        console.error(err);
    }
});

// REGISTER
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const role = document.getElementById("role").value;
    const msg = document.getElementById("registerMsg");

    try {
        const response = await fetch("/Kim/api/users/register.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, role }),
        });

        const data = await response.json();
        msg.textContent = data.message;
        msg.style.color = data.success ? "#8EB69B" : "#ff5c5c";

        if (data.success) {
            showLogin();
        }
    } catch (err) {
        msg.textContent = "Eroare la înregistrare.";
        msg.style.color = "#ff5c5c";
        console.error(err);
    }
});
