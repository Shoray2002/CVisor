import { predictWebcam } from "../res/js/prediction.js";
const video = document.getElementById("webcam");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");
const start = document.getElementById("start");
const frame = document.getElementById("frame");
const box = document.getElementById("box");
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
  });
}

start.addEventListener("click", () => {
  startDrawing();
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  demosSection.classList.remove("invisible");
});

function startDrawing() {
  predictWebcam(model, video, frame, box);
  requestAnimationFrame(startDrawing);
}
