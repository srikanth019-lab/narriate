function validateLogin() {
    let contact = document.getElementById("identifier").value.trim();
    let password = document.getElementById("password").value.trim();
    let error = document.getElementById("error");

    error.innerText = "";

    if (!contact || !password) {
        error.innerText = "All fields are required";
        return false;
    }

    return true;
}