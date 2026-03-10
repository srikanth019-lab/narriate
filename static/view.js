let likeCount = 0;
let heartCount = 0;

const likeBtn = document.getElementById("likeBtn");
const heartBtn = document.getElementById("heartBtn");
const sendBtn = document.getElementById("sendBtn");
const commentInput = document.getElementById("commentInput");
const commentsBox = document.getElementById("commentsBox");

// Like button
likeBtn.onclick = () => {
    likeCount++;
    document.getElementById("likeCount").innerText = likeCount;
};

// Heart button
heartBtn.onclick = () => {
    heartCount++;
    document.getElementById("heartCount").innerText = heartCount;
};

// Send comment
sendBtn.onclick = () => {
    const text = commentInput.value.trim();
    if (!text) return;

    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    commentDiv.innerText = "User: " + text;
    commentsBox.appendChild(commentDiv);

    commentInput.value = "";
};