import { predictWebcam } from "../public/js/prediction.js";
const analyze_button = document.querySelector("#analyze-button");
const video_input = document.querySelector("#video-input");
const video_preview = document.querySelector("#video-preview");
const frame = document.getElementById("frame");
const box = document.getElementById("box");

video_input.addEventListener("change", function () {
  let file = this.files[0];
  let blobURL = URL.createObjectURL(file);
  video_preview.src = blobURL;
});
analyze_button.addEventListener("click", function () {
  if (!model) {
    return;
  }
  startDrawing();
  console.log("done");
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  analyze_button.classList.remove("invisible");
});

function startDrawing() {
  predictWebcam(model, video_preview, frame, box);
  window.requestAnimationFrame(startDrawing);
}
