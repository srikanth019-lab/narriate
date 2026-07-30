// profile.js
console.log("PROFILE JS LOADED - version ABCDE");
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

    if (searchInput) {

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

    }

});



const followBtn = document.getElementById("follow-btn");

     console.log("Button:", followBtn);

     if (followBtn) {

    followBtn.addEventListener("click", async () => {

    console.log("Current button:", followBtn.textContent);

    const userId = followBtn.dataset.userId;
    const isFollowing = followBtn.textContent.trim() === "Following";

    const url = isFollowing
        ? `/unfollow/${userId}`
        : `/follow/${userId}`;

    console.log("Sending:", url);

    const response = await fetch(url, {
        method: "POST"
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", data);

    if (!response.ok) {
        alert(data.error);
        return;
    }

    const followersCount = document.getElementById("followers-count");

    let count = parseInt(followersCount.textContent, 10);

    if (isFollowing) {
        followBtn.textContent = "Follow";
        followersCount.textContent = count - 1;
    } else {
        followBtn.textContent = "Following";
        followersCount.textContent = count + 1;
    }

    console.log("New button:", followBtn.textContent);
 });

}

