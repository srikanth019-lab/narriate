const fileInput = document.querySelector('input[name="profile_photo"]');
const profilePhoto = document.querySelector('.profile-photo');
const fileName = document.getElementById("file-name");


// Preview selected profile photo
if (fileInput && profilePhoto) {

    fileInput.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            profilePhoto.src = e.target.result;
        };

        reader.readAsDataURL(file);

    });

}


// Show selected file name
if (fileInput && fileName) {

    fileInput.addEventListener("change", function () {

        if (this.files.length > 0) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = "No photo selected";
        }

    });

}