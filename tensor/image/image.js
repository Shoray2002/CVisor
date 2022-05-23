import { predictWebcam } from "../res/js/prediction.js";
const image = new Image();
const image_input = document.querySelector("#image-input");
const analyze_button = document.querySelector("#analyze-button");
const canvas = document.getElementById("canvas");
let ctx;
const imageMetadata = {};
image_input.addEventListener("change", function () {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    image.src = uploaded_image;
    image.addEventListener("load", () => {
      imageMetadata.width = image.width;
      imageMetadata.height = image.height;
      // draw image on canvas
      canvas.width = image.width;
      canvas.height = image.height;
      ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, image.width, image.height);
    });
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
  predictWebcam(model, image, ctx, imageMetadata);
  // window.requestAnimationFrame(startDrawing);
}
