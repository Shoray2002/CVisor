const image_input = document.querySelector("#image-input");
const display_image = document.querySelector("#display-image");
image_input.addEventListener("change", function () {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    const image = new Image();
    image.src = uploaded_image;
    image.addEventListener("load", () => {
      display_image.style.height = `${image.width}px`;
      display_image.style.width = `${image.height}px`;
      display_image.style.backgroundImage = `url(${uploaded_image})`;
    });
    
  });
  reader.readAsDataURL(this.files[0]);
});
