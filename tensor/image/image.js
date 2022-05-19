import { predictWebcam } from "../public/js/prediction.js";
const image = new Image();
const image_input = document.querySelector("#image-input");
const display_image = document.querySelector("#display-image");
const analyze_button = document.querySelector("#analyze-button");
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
image_input.addEventListener("change", function () {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    image.src = uploaded_image;
    image.addEventListener("load", () => {
      display_image.style.height = `${image.height}px`;
      display_image.style.width = `${image.width}px`;
      display_image.style.backgroundImage = `url(${uploaded_image})`;
      analyze_button.classList.remove("invisible");
    });
  });
  reader.readAsDataURL(this.files[0]);
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
});

analyze_button.addEventListener("click", function () {
  if (!model) {
    return;
  }
  startDrawing();
  console.log("done");
});

function startDrawing() {
  predictWebcam(model, image, ctx);
}
