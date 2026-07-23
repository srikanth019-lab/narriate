function toggleSound(video) {
    video.muted = !video.muted;
}

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