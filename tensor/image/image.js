import { predictWebcam } from "../res/js/prediction.js";
const image = new Image();
const image_input = document.querySelector("#image-input");
const display_image = document.querySelector("#display-image");
const analyze_button = document.querySelector("#analyze-button");
const frame = document.getElementById("frame");
const box = document.getElementById("box");
const imageMetadata = {};
image_input.addEventListener("change", function () {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    image.src = uploaded_image;
    image.addEventListener("load", () => {
      imageMetadata.width = image.width;
      imageMetadata.height = image.height;
      display_image.style.height = `${image.height}px`;
      display_image.style.width = `${image.width}px`;
      display_image.style.backgroundImage = `url(${uploaded_image})`;
    });
    console.log(image);
  });
  reader.readAsDataURL(this.files[0]);
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  analyze_button.classList.remove("invisible");
});

analyze_button.addEventListener("click", function () {
  if (!model) {
    return;
  }
  startDrawing();
  console.log("done");
});

function startDrawing() {
  predictWebcam(model, image, frame, box, imageMetadata);
  // window.requestAnimationFrame(startDrawing);
}
