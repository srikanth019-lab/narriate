document.addEventListener("DOMContentLoaded", function () {

    const toggle = document.getElementById("themeToggle");

    // Get saved theme
    const savedTheme = localStorage.getItem("theme") || "light";

    // Apply saved theme
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Set toggle position
    if (toggle) {
        toggle.checked = savedTheme === "dark";

        toggle.addEventListener("change", function () {

            const newTheme = this.checked ? "dark" : "light";

            // Apply theme
            document.documentElement.setAttribute("data-theme", newTheme);

            // Save theme
            localStorage.setItem("theme", newTheme);

        });
    }

});