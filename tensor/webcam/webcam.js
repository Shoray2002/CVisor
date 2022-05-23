import { predictWebcam } from "../res/js/prediction.js";
const video = document.getElementById("webcam");
const section = document.querySelector("section");
const enableWebcamButton = document.getElementById("webcamButton");
const start = document.getElementById("start");
start.disabled = true;
const canvas = document.getElementById("canvas");
let ctx;
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
const webCamemetadata = {};
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
  // show available cameras
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        if (device.kind === "videoinput") {
          console.log(device.label);
        }
      });
    })
    .catch((err) => {
      console.log(err.name + ": " + err.message);
    });

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    webCamemetadata.width = stream.getVideoTracks()[0].getSettings().width;
    webCamemetadata.height = stream.getVideoTracks()[0].getSettings().height;
    video.srcObject = stream;
    canvas.width = webCamemetadata.width;
    canvas.height = webCamemetadata.height;
    ctx = canvas.getContext("2d");
    start.disabled = false;
  });
}

start.addEventListener("click", () => {
  startDrawing();
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  section.classList.remove("invisible");
});

function startDrawing() {
  predictWebcam(model, video, ctx, webCamemetadata);
  requestAnimationFrame(startDrawing);
}
