const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

searchInput.addEventListener("input", async function () {

    const query = searchInput.value.trim();

    if (query === "") {
        results.innerHTML = "";
        return;
    }

    try {

        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

        const users = await response.json();

        results.innerHTML = "";

        if (users.length === 0) {
            results.innerHTML = "<p>No users found</p>";
            return;
        }

        users.forEach(user => {

            results.innerHTML += `
                <a href="/profile/${user.username}" class="user">
                    <img src="${user.profile_pic}" alt="Profile">

                    <div class="info">
                        <h4>${user.username}</h4>
                        <p>${user.bio || ""}</p>
                    </div>
                </a>
            `;

        });

    } catch (error) {
        console.error(error);
    }

});