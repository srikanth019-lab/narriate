document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("emojiSearch");
    const results = document.getElementById("emojiResults");

    if (!searchInput || !results) return;

    searchInput.addEventListener("input", async () => {

        const query = searchInput.value.trim();

        if (!query) {
            results.innerHTML = "";
            return;
        }

        const response = await fetch(`/api/emojis-search?q=${encodeURIComponent(query)}`);
        const emojis = await response.json();

        results.innerHTML = "";

        emojis.forEach(item => {
            const button = document.createElement("button");
            button.className = "emoji-item";
            button.textContent = item.emoji;
            button.title = item.name;
            button.onclick = () => {
                window.location.href = `/emoji/${item.id}`;
            };
            results.appendChild(button);
        });

    });

});

