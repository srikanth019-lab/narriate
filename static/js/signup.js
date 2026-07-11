function validateForm() {
    let username = document.getElementById("username").value.trim();
    let contact = document.getElementById("contact").value.trim();
    let password = document.getElementById("password").value.trim();
    let error = document.getElementById("error");

    error.innerText = "";

    // Basic validation
    if (!username || !contact || !password) {
        error.innerText = "All fields are required";
        return false;
    }

    // Password length check
    if (password.length < 6) {
        error.innerText = "Password must be at least 6 characters";
        return false;
    }

    return true;
}