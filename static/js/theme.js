document.addEventListener("DOMContentLoaded", function () {

    const toggle = document.getElementById("themeToggle");

    if (!toggle) return;

    const savedTheme = localStorage.getItem("theme") || "light";

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    toggle.checked = savedTheme === "dark";


    toggle.addEventListener("change", function () {

        const newTheme = this.checked
            ? "dark"
            : "light";

        document.documentElement.setAttribute(
            "data-theme",
            newTheme
        );

        localStorage.setItem("theme", newTheme);
    });

});