import { predictWebcam } from "../res/js/prediction.js";
const video = document.getElementById("webcam");
const section = document.querySelector("section");
const enableWebcamButton = document.getElementById("webcamButton");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
let status;
const webCamemetadata = {};
let constraints = {
  video: {
    facingMode: "environment",
    deviceId: webCamemetadata.deviceId ? webCamemetadata.deviceId : undefined,
  },
};
start.disabled = true;
stop.disabled = true;
let cameras = [];
const canvas = document.getElementById("canvas");
let ctx;
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
  selection.id = "cameraSelection";
  selection.classList.add("cameraSelection");
  section.appendChild(selection);
  navigator.mediaDevices.getUserMedia(constraints);
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

selection.addEventListener("change", function (event) {
  webCamemetadata.deviceId = event.target.value;
  enableCam();
});

function enableCam() {
  if (!model) {
    return;
  }
  enableWebcamButton.classList.add("removed");
  constraints = {
    video: {
      facingMode: "environment",
      deviceId: webCamemetadata.deviceId ? webCamemetadata.deviceId : undefined,
    },
  };
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    webCamemetadata.width = stream.getVideoTracks()[0].getSettings().width;
    webCamemetadata.height = stream.getVideoTracks()[0].getSettings().height;
    video.srcObject = stream;
    canvas.width = webCamemetadata.width;
    canvas.height = webCamemetadata.height;
    ctx = canvas.getContext("2d");
    start.disabled = false;
  });
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        if (device.kind === "videoinput") {
          cameras.push(device);
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label;
          selection.appendChild(option);
        }
      });
    })
    .catch((err) => {
      console.log(err.name + ": " + err.message);
    });
}

start.addEventListener("click", () => {
  stop.disabled = false;
  status = true;
  startDrawing();
});
stop.addEventListener("click", () => {
  status = false;
  stop.disabled = true;
});

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  section.classList.remove("invisible");
});

function startDrawing() {
  predictWebcam(model, video, ctx, webCamemetadata, status);
  requestAnimationFrame(startDrawing);
}
