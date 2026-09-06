let selectedEmojiId = null;
let selectedEmoji = null;

const emojiButtons = document.querySelectorAll(".emoji-btn");
const continueBtn = document.getElementById("continueBtn");

const mediaMenu = document.getElementById("mediaMenu");
const mediaMenuOverlay = document.getElementById("mediaMenuOverlay");

const cameraBtn = document.getElementById("cameraBtn");
const photosBtn = document.getElementById("photosBtn");
const cancelBtn = document.getElementById("cancelBtn");

const cameraInput = document.getElementById("cameraInput");
const photosInput = document.getElementById("photosInput");


/* =========================
   CLOUDINARY SETTINGS
========================= */

const CLOUDINARY_CLOUD_NAME = "gxy7cvmb";
const CLOUDINARY_UPLOAD_PRESET = "happstat_updates";


/* =========================
   SELECT EMOJI
========================= */

emojiButtons.forEach(button => {
    button.addEventListener("click", () => {

        emojiButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        button.classList.add("selected");

        selectedEmojiId = button.dataset.id;
        selectedEmoji = button.dataset.emoji;

        continueBtn.disabled = false;
    });
});


/* =========================
   CONTINUE → MEDIA MENU
========================= */

continueBtn.addEventListener("click", () => {

    if (!selectedEmojiId) {
        return;
    }

    sessionStorage.setItem("statusEmojiId", selectedEmojiId);
    sessionStorage.setItem("statusEmoji", selectedEmoji);

    mediaMenu.classList.add("show");
});


/* =========================
   CAMERA
========================= */

cameraBtn.addEventListener("click", () => {
    cameraInput.click();
});


/* =========================
   PHOTOS
========================= */

photosBtn.addEventListener("click", () => {
    photosInput.click();
});


/* =========================
   CANCEL
========================= */

cancelBtn.addEventListener("click", () => {
    mediaMenu.classList.remove("show");
});


mediaMenuOverlay.addEventListener("click", () => {
    mediaMenu.classList.remove("show");
});


/* =========================
   HANDLE SELECTED MEDIA
========================= */

async function handleSelectedMedia(file) {

    if (!file) {
        return;
    }

    console.log("Selected file:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size);

    mediaMenu.classList.remove("show");

    const mediaType = file.type.startsWith("video/")
        ? "video"
        : "image";

    try {

        /* =========================
           UPLOAD TO CLOUDINARY
        ========================= */

        console.log("Uploading to Cloudinary...");

        const uploadUrl =
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${mediaType}/upload`;

        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData
        });

        const cloudinaryData = await cloudinaryResponse.json();

        if (!cloudinaryResponse.ok) {

            console.error("Cloudinary error:", cloudinaryData);

            throw new Error(
                cloudinaryData.error?.message ||
                "Cloudinary upload failed"
            );
        }

        console.log("Cloudinary upload successful");
        console.log("Secure URL:", cloudinaryData.secure_url);
        console.log("Public ID:", cloudinaryData.public_id);


        /* =========================
           SAVE UPDATE IN FLASK
        ========================= */

        console.log("Saving Update...");

        const saveResponse = await fetch("/updates/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                emoji_id: selectedEmojiId,
                media_url: cloudinaryData.secure_url,
                media_type: mediaType,
                cloudinary_public_id: cloudinaryData.public_id
            })
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok || !saveData.success) {

            console.error("Save Update error:", saveData);

            throw new Error(
                saveData.error ||
                "Could not save Update"
            );
        }


        /* =========================
           SUCCESS
        ========================= */

        console.log("Update saved successfully!");
        console.log("Post ID:", saveData.post_id);

        window.location.href = "/updates";

    } catch (error) {

        console.error("UPDATE UPLOAD ERROR:", error);

        alert(
            "Could not post your Update.\n\n" +
            error.message
        );
    }
}


/* =========================
   CAMERA FILE SELECTED
========================= */

cameraInput.addEventListener("change", () => {

    if (cameraInput.files.length > 0) {

        const file = cameraInput.files[0];

        handleSelectedMedia(file);
    }
});


/* =========================
   PHOTOS FILE SELECTED
========================= */

photosInput.addEventListener("change", () => {

    if (photosInput.files.length > 0) {

        const file = photosInput.files[0];

        handleSelectedMedia(file);
    }
});