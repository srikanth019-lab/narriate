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