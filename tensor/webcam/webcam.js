import { predictWebcam } from "../public/js/prediction.js";
const video = document.getElementById("webcam");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");
const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!model) {
    return;
  }
  event.target.classList.add("removed");
  const constraints = {
    video: true,
  };
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", startDrawing);
  });
}

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  demosSection.classList.remove("invisible");
});

function startDrawing() {
  predictWebcam(model, video, ctx);
  requestAnimationFrame(startDrawing);
}
