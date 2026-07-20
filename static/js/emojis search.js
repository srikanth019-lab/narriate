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

        const response = await fetch(`/api/emojis-search?q=${query}`);
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