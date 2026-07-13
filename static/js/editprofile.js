const fileInput = document.querySelector('input[name="profile_photo"]');
const profilePhoto = document.querySelector('.profile-photo');

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

