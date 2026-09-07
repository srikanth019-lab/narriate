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
   UPLOAD PROGRESS ELEMENTS
========================= */

const uploadProgress = document.getElementById("uploadProgress");
const progressCircle = document.getElementById("progressCircle");
const progressCheck = document.getElementById("progressCheck");
const uploadStatus = document.getElementById("uploadStatus");

const CIRCLE_LENGTH = 263.9;


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

    cameraInput.value = "";
    cameraInput.click();

});


/* =========================
   PHOTOS
========================= */

photosBtn.addEventListener("click", () => {

    photosInput.value = "";
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
   SHOW UPLOAD PROGRESS
========================= */

function showUploadProgress() {

    uploadProgress.classList.add("show");

    progressCheck.classList.remove("show");

    progressCircle.style.strokeDashoffset = CIRCLE_LENGTH;

    uploadStatus.textContent = "Uploading…";

}


/* =========================
   UPDATE CIRCLE
========================= */

function updateProgress(percent) {

    const offset =
        CIRCLE_LENGTH -
        (CIRCLE_LENGTH * percent / 100);

    progressCircle.style.strokeDashoffset = offset;

}


/* =========================
   PROCESSING STATE
========================= */

function showProcessing() {

    uploadStatus.textContent = "Processing…";

    /*
       Keep the ring rotating while
       Cloudinary/server processing happens.
    */

    progressCircle.classList.add("processing");

}


/* =========================
   SUCCESS STATE
========================= */

function showSuccess() {

    progressCircle.classList.remove("processing");

    progressCircle.style.strokeDashoffset = 0;

    uploadStatus.textContent = "Posted";

    progressCheck.classList.add("show");

}


/* =========================
   UPLOAD TO CLOUDINARY
   WITH REAL PROGRESS
========================= */

function uploadToCloudinary(file, mediaType) {

    return new Promise((resolve, reject) => {

        const uploadUrl =
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${mediaType}/upload`;

        const formData = new FormData();

        formData.append("file", file);
        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );

        const xhr = new XMLHttpRequest();

        xhr.open("POST", uploadUrl, true);


        /* =========================
           REAL UPLOAD PROGRESS
        ========================= */

        xhr.upload.addEventListener("progress", event => {

            if (event.lengthComputable) {

                const percent =
                    Math.round(
                        (event.loaded / event.total) * 100
                    );

                updateProgress(percent);

            }

        });


        /* =========================
           UPLOAD COMPLETE
        ========================= */

        xhr.onload = () => {

            let data;

            try {
                data = JSON.parse(xhr.responseText);
            } catch (error) {

                reject(
                    new Error("Invalid Cloudinary response")
                );

                return;
            }


            if (xhr.status >= 200 && xhr.status < 300) {

                resolve(data);

            } else {

                reject(
                    new Error(
                        data.error?.message ||
                        "Cloudinary upload failed"
                    )
                );

            }

        };


        /* =========================
           NETWORK ERROR
        ========================= */

        xhr.onerror = () => {

            reject(
                new Error(
                    "Network error while uploading"
                )
            );

        };


        /* =========================
           START
        ========================= */

        xhr.send(formData);

    });

}


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

    showUploadProgress();


    const mediaType =
        file.type.startsWith("video/")
            ? "video"
            : "image";


    try {

        /* =========================
           CLOUDINARY UPLOAD
        ========================= */

        console.log(
            "Uploading to Cloudinary..."
        );

        const cloudinaryData =
            await uploadToCloudinary(
                file,
                mediaType
            );


        console.log(
            "Cloudinary upload successful"
        );

        console.log(
            "Secure URL:",
            cloudinaryData.secure_url
        );

        console.log(
            "Public ID:",
            cloudinaryData.public_id
        );


        /* =========================
           PROCESSING
        ========================= */

        showProcessing();


        /* =========================
           SAVE UPDATE IN FLASK
        ========================= */

        console.log("Saving Update...");


        const saveResponse = await fetch(
            "/updates/create",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    emoji_id: selectedEmojiId,

                    media_url:
                        cloudinaryData.secure_url,

                    media_type:
                        mediaType,

                    cloudinary_public_id:
                        cloudinaryData.public_id

                })

            }
        );


        const saveData =
            await saveResponse.json();


        if (
            !saveResponse.ok ||
            !saveData.success
        ) {

            console.error(
                "Save Update error:",
                saveData
            );

            throw new Error(
                saveData.error ||
                "Could not save Update"
            );

        }


        /* =========================
           SUCCESS
        ========================= */

        console.log(
            "Update saved successfully!"
        );

        console.log(
            "Post ID:",
            saveData.post_id
        );


        showSuccess();


        /*
           Give the user a very short
           confirmation before redirecting.
        */

        setTimeout(() => {

            window.location.href =
                "/updates";

        }, 600);


    } catch (error) {

        console.error(
            "UPDATE UPLOAD ERROR:",
            error
        );


        uploadProgress.classList.remove("show");


        alert(
            "Could not post your Update.\n\n" +
            error.message
        );

    }

}


/* =========================
   CAMERA FILE SELECTED
========================= */

cameraInput.addEventListener(
    "change",
    () => {

        if (
            cameraInput.files &&
            cameraInput.files.length > 0
        ) {

            const file =
                cameraInput.files[0];

            handleSelectedMedia(file);

        }

    }
);


/* =========================
   PHOTOS FILE SELECTED
========================= */

photosInput.addEventListener(
    "change",
    () => {

        if (
            photosInput.files &&
            photosInput.files.length > 0
        ) {

            const file =
                photosInput.files[0];

            handleSelectedMedia(file);

        }

    }
);