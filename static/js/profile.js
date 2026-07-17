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



document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("emojiSearch");
    const results = document.getElementById("emojiResults");

    if (!searchInput) return;

    searchInput.addEventListener("input", async () => {

        const query = searchInput.value.trim();

        if (!query) {
            results.innerHTML = "";
            return;
        }

        const response = await fetch(`/api/emojis?q=${query}`);
        const emojis = await response.json();

        results.innerHTML = "";

        emojis.forEach(item => {

            const button = document.createElement("button");

            button.textContent = item.emoji;
            button.title = item.name;

            results.appendChild(button);

        });


    });

});

emojiDiv.className = "emoji-item";