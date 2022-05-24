import { predictWebcam } from "../res/js/prediction.js";
const analyze_button = document.querySelector("#analyze-button");
const video_input = document.querySelector("#video-input");
const video_preview = document.querySelector("#video-preview");
const canvas = document.querySelector("#canvas");
let ctx;
let aspect_ratio;
const metadata = {};
video_input.addEventListener("change", function () {
  let file = this.files[0];
  let blobURL = URL.createObjectURL(file);
  video_preview.src = blobURL;
});
video_preview.addEventListener("loadedmetadata", function () {
  console.log(this.videoWidth, this.videoHeight);
  metadata.width = this.videoWidth;
  metadata.height = this.videoHeight;
  aspect_ratio = this.videoWidth / this.videoHeight;
  canvas.width = this.videoWidth;
  canvas.height = this.videoHeight;
  canvas.style.transformOrigin = "0 0";
  if (aspect_ratio < 1) {
    video_preview.height = 640;
    video_preview.width = aspect_ratio * video_preview.height;
  } else {
    video_preview.height = 480;
    video_preview.width = aspect_ratio * video_preview.height;
  }
  canvas.style.transform = `scale(${video_preview.width / this.videoWidth})`;
  // canvas.width = video_preview.width;
  // canvas.height = video_preview.height;
  ctx = canvas.getContext("2d");
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
  predictWebcam(model, video_preview, ctx, metadata);
  window.requestAnimationFrame(startDrawing);
}
