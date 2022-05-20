import { predictWebcam } from "../public/js/prediction.js";
const analyze_button = document.querySelector("#analyze-button");
const video_input = document.querySelector("#video-input");
const video_preview = document.querySelector("#video-preview");
let uploaded_video;
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

video_input.addEventListener("change", function () {
  let file = this.files[0];
  let blobURL = URL.createObjectURL(file);
  video_preview.src = blobURL;
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
  predictWebcam(model, uploaded_video, ctx);
  window.requestAnimationFrame(startDrawing);
}
