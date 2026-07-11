// profile.js

// Search button
const searchBtn = document.querySelector(".search-btn");

if (searchBtn) {
    searchBtn.addEventListener("click", function () {
        window.location.href = "/search";
    });
}

// Edit Profile button
const editBtn = document.querySelector(".edit-btn");

if (editBtn) {
    editBtn.addEventListener("click", function () {
        window.location.href = "/edit-profile";
    });
}