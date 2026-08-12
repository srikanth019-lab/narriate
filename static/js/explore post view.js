const videos = document.querySelectorAll("video");

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        const video = entry.target;

        if (entry.isIntersecting) {
            video.play();
        } else {
            video.pause();
            video.currentTime = 0;
        }

    });

}, {
    threshold: 0.8
});


videos.forEach(video => {
    observer.observe(video);
});

const feed = document.querySelector(".post-feed");

let isScrolling = false;

feed.addEventListener("scroll", () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            isScrolling = false;
        });
        isScrolling = true;
    }
});



document.querySelectorAll(".dots-btn").forEach(button => {

    button.addEventListener("click", () => {

        const menu = button.nextElementSibling;

        menu.style.display =
            menu.style.display === "block"
            ? "none"
            : "block";

    });

});




document.querySelectorAll(".follow-button").forEach(button => {

    button.addEventListener("click", async (event) => {

        event.preventDefault();
        event.stopPropagation();

        const userId = button.dataset.userId;

        if (!userId) {
            console.error("User ID missing");
            return;
        }

        const isFollowing = button.textContent.trim() === "Following";

        const url = isFollowing
            ? `/unfollow/${userId}`
            : `/follow/${userId}`;

        try {

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                console.error("Follow request failed:", response.status);
                return;
            }

            if (isFollowing) {
                button.textContent = "Follow";
                button.classList.remove("following");
            } else {
                button.textContent = "Following";
                button.classList.add("following");
            }

        } catch (error) {

            console.error("Follow error:", error);

        }

    });

});



async function sharePost(postId) {

    const shareUrl =
        `${window.location.origin}/explore/video/${postId}`;

    if (navigator.share) {

        await navigator.share({
            title: "Check out this video",
            url: shareUrl
        });

    } else {

        await navigator.clipboard.writeText(shareUrl);

        alert("Link copied!");
    }
}



function toggleVideoMenu(event, postId) {
    event.stopPropagation();

    const menu = document.getElementById("video-menu-" + postId);

    if (!menu) {
        console.log("Menu not found:", postId);
        return;
    }

    menu.style.display =
        menu.style.display === "block" ? "none" : "block";
}


function deleteVideo(postId) {

    if (!confirm("Are you sure you want to delete this video?")) {
        return;
    }

    fetch(`/delete-explore-post/${postId}`, {
        method: "POST"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Delete failed: " + response.status);
        }

        return response.json();
    })
    .then(data => {

        if (data.success) {

            const post = document.getElementById("post-" + postId);

            if (post) {
                post.remove();
            }

        } else {
            alert(data.message || "Unable to delete video.");
        }

    })
    .catch(error => {
        console.error("Delete request failed:", error);
        alert("Something went wrong.");
    });
}