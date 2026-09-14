// Apply theme immediately — before the page is displayed
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);


// Setup theme toggle after HTML is loaded
document.addEventListener("DOMContentLoaded", function () {

    const toggle = document.getElementById("themeToggle");

    if (toggle) {
        toggle.checked = savedTheme === "dark";

        toggle.addEventListener("change", function () {

            const newTheme = this.checked ? "dark" : "light";

            document.documentElement.setAttribute("data-theme", newTheme);

            localStorage.setItem("theme", newTheme);
        });
    }

});                                                      



