


document.addEventListener("DOMContentLoaded", () => {

const videos = document.querySelectorAll(".full-video");

let progressAnimation = null;

function startProgress(reel) {

    const fill = reel.querySelector(".story-progress-fill");
    const media = reel.querySelector(".full-video");

    console.log("PROGRESS STARTED");
    console.log("ACTIVE:", reel.classList.contains("active"));
    console.log("MEDIA:", media);
    console.log("MEDIA TYPE:", media ? media.tagName : "NONE");

    if (!fill || !media) {
        console.log("Progress elements missing");
        return;
    }

    if (progressAnimation) {
        cancelAnimationFrame(progressAnimation);
        progressAnimation = null;
    }

    fill.style.width = "0%";

    // ================================
    // VIDEO
    // ================================
    if (media.tagName === "VIDEO") {

        console.log(
    "VIDEO STATE:",
    "duration =", media.duration,
    "currentTime =", media.currentTime,
    "paused =", media.paused
);

        const updateVideoProgress = () => {

            if (!reel.classList.contains("active")) {
                return;
            }

            if (media.duration && !media.paused) {

                const percent =
                    (media.currentTime / media.duration) * 100;

                fill.style.width = percent + "%";

                console.log(
                    "VIDEO PROGRESS:",
                    percent.toFixed(1) + "%"
                );
            }

            progressAnimation =
                requestAnimationFrame(updateVideoProgress);
        };

        updateVideoProgress();

        return;
    }


    // ================================
    // IMAGE = 5 SECONDS
    // ================================

    const startTime = performance.now();

    const updateImageProgress = (currentTime) => {

        if (!reel.classList.contains("active")) {
            return;
        }

        const elapsed =
            currentTime - startTime;

        const percent =
            (elapsed / 5000) * 100;

        fill.style.width =
            Math.min(percent, 100) + "%";

        console.log(
            "IMAGE PROGRESS:",
            percent.toFixed(1) + "%"
        );

        if (elapsed >= 5000) {

            fill.style.width = "100%";

            console.log("IMAGE FINISHED");

            return;
        }

        progressAnimation =
            requestAnimationFrame(updateImageProgress);
    };

    progressAnimation =
        requestAnimationFrame(updateImageProgress);
}


// ========================================
// TAP CONTROLS
// LEFT 40%  = PREVIOUS
// CENTER 20% = PLAY / PAUSE
// RIGHT 40% = NEXT
// ========================================

const reels = Array.from(document.querySelectorAll(".reel"));

const feed = document.querySelector(".post-feed");

const currentPostId = feed.dataset.currentPostId;

// Set the clicked post as active
const currentPost = document.getElementById(`post-${currentPostId}`);

if (currentPost) {
    currentPost.classList.add("active");
}


if (currentPost) {
    startProgress(currentPost);
}


reels.forEach((reel, index) => {

    reel.addEventListener("click", function(event) {

        // Ignore bottom information bar
        if (event.target.closest(".post-bottom-bar")) {
            return;
        }

        // Ignore creator menu
        if (
            event.target.closest(".video-menu-btn") ||
            event.target.closest(".video-menu")
        ) {
            return;
        }

        const rect = reel.getBoundingClientRect();

        // Position of tap inside the reel
        const tapX = event.clientX - rect.left;

        // Percentage of screen tapped
        const tapPercent = tapX / rect.width;

        console.log("tapX:", tapX);
        console.log("reel width:", rect.width);
        console.log("tapPercent:", tapPercent);

        const video = reel.querySelector("video.full-video");

        // -------------------------------
        // LEFT 40% → PREVIOUS
        // -------------------------------

        if (tapPercent < 0.40) {
            console.log("LEFT DETECTED", index);

            if (index > 0) {
                console.log("GOING PREVIOUS");

                reel.classList.remove("active");

                const previousReel = reels[index - 1];

                previousReel.classList.add("active");

                const previousVideo = previousReel.querySelector("video.full-video");

                if (previousVideo) {
                    previousVideo.currentTime = 0;

                    previousVideo.play().catch(error => {
                        console.log("Play failed:", error);
                    });
                }

                startProgress(previousReel);
            } else {
                console.log("ALREADY FIRST REEL");
            }

            return;
        }

        // -------------------------------
        // RIGHT 40% → NEXT
        // -------------------------------

        if (tapPercent > 0.60) {
            console.log("RIGHT DETECTED", index);

            if (index < reels.length - 1) {
                console.log("GOING NEXT");

                reel.classList.remove("active");

                const nextReel = reels[index + 1];

                nextReel.classList.add("active");

                const nextVideo = nextReel.querySelector("video.full-video");

                if (nextVideo) {
                    nextVideo.currentTime = 0;

                    nextVideo.play().catch(error => {
                        console.log("Play failed:", error);
                    });
                }

                startProgress(nextReel);
            } else {
                console.log("ALREADY LAST REEL");
            }

            return;
        }

        // -------------------------------
        // CENTER 20% → PLAY / PAUSE
        // -------------------------------

        console.log("CENTER TAP → Play/Pause");

        if (video) {

            if (video.paused) {

                video.play().catch(error => {
                    console.log("Play failed:", error);
                });

            } else {

                video.pause();

            }

        }

});





const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        const media = entry.target;

        // Only control <video> elements
        if (media.tagName !== "VIDEO") {
            return;
        }

        if (entry.isIntersecting) {

            media.play().catch(error => {
                console.log("Autoplay blocked:", error);
            });

        } else {

            media.pause();
            media.currentTime = 0;

        }

    });

}, {
    threshold: 0.7
});
videos.forEach(video => {
    observer.observe(video);
});


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

    if (!confirm("Are you sure you want to delete this happs?")) {
        return;
    }

    fetch(`/delete-update-post/${postId}`, {
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



function sharePost(postId) {

    const shareUrl =
        `${window.location.origin}/updates/post/${postId}`;

    if (navigator.share) {

        navigator.share({
            title: "Happstat",
            text: "Check out this reel on Happstat",
            url: shareUrl
        }).catch(error => {
            console.log("Share cancelled:", error);
        });

    } else {

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("Link copied!");
            })
            .catch(error => {
                console.error("Copy failed:", error);
            });

    }
}



function deleteHapps(postId) {

    if (!confirm("Are you sure you want to delete this Happs?")) {
        return;
    }

    fetch(`/delete-updates-post/${postId}`, {
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

             // Go directly back to Updates after deletion
            window.location.replace("/updates");

        } else {
            alert(data.message || "Unable to delete Happs.");
        }

    })
    .catch(error => {
        console.error("Delete Happs failed:", error);
        alert("Something went wrong.");
    });
}



function deleteVideo(postId) {

    if (!confirm("Are you sure you want to delete this Moment?")) {
        return;
    }

    fetch(`/delete-moment/${postId}`, {
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
            window.location.replace("/updates");
        } else {
            alert(data.message || "Unable to delete Moment.");
        }

    })
    .catch(error => {
        console.error("Delete Moment failed:", error.message);
        alert("Something went wrong.");
    });
}

// Make functions available to the HTML/page
window.sharePost = sharePost;
window.deleteVideo = deleteVideo;
window.deleteHapps = deleteHapps;
window.toggleVideoMenu = toggleVideoMenu;

});
});


