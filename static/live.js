/* Camera */
const video = document.getElementById('video');
let stream;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(s => {
    stream = s;
    video.srcObject = stream;
})
.catch(() => {
    alert("Camera permission required!");
});

/* Viewer Simulation */
let viewerCount = 0;
function increaseViewers() {
    viewerCount += Math.floor(Math.random() * 3);
    document.getElementById("viewerCount").innerText = viewerCount;
}
setInterval(increaseViewers, 3000);

/* Like & Heart */
let likeCount = 0;
let heartCount = 0;

document.getElementById('likeBtn').onclick = function() {
    likeCount++;
    document.getElementById("likeCount").innerText = likeCount;
};

document.getElementById('heartBtn').onclick = function() {
    heartCount++;
    document.getElementById("heartCount").innerText = heartCount;
};

/* End Live */
document.getElementById('endLiveBtn').onclick = function() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    alert("Live Ended");
};

document.getElementById("getViewersBtn").onclick = function () {

    const streamId = window.location.pathname.split("/").pop();

    const shareData = {
        title: "Join my live stream!",
        text: "Watch my live now!",
        url: window.location.origin + "/live/" + streamId
    };

    if (navigator.share) {
        navigator.share(shareData)
        .then(() => console.log("Shared successfully"))
        .catch((err) => console.log(err));
    } else {
        alert("Sharing not supported on this browser");
    }
};