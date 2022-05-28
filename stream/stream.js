const video = document.getElementById("webcam");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
const canvas = document.getElementById("canvas");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");
let run_status = false;
let selectedCam;
start.addEventListener("click", () => {
  loadModel();
  run_status = true;
  analyze();
  body.classList.add("preload");
  loader.style.display = "flex";
  loader.style.backgroundColor = "#e4f0ff1b";
});

stop.addEventListener("click", () => {
  run_status = false;
});
selection.addEventListener("change", function () {
  selectedCam = this.value;
  console.log(selectedCam);
  setUpCamera();
});

window.onload = function () {
  navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(function (device) {
      if (device.kind === "videoinput") {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label || "camera " + selection.length;
        selection.appendChild(option);
      }
    });
  });
  setUpCamera();
  body.classList.remove("preload");
  loader.style.display = "none";
};

function setUpCamera() {
  navigator.mediaDevices
    .getUserMedia({
      video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
    })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    });
}

async function loadModel() {
  await faceapi.loadSsdMobilenetv1Model("../res/models");
}

async function analyze() {
  if (run_status && faceapi.nets.ssdMobilenetv1.params) {
    body.classList.remove("preload");
    loader.style.display = "none";
    console.log("Model loaded");
    let minConfidence = 0.3;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let task = faceapi.detectAllFaces(video, options);
    const result = await task;
    if (result) {
      const dims = faceapi.matchDimensions(canvas, video, true);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
    }
    requestAnimationFrame(analyze);
  } else if (!faceapi.nets.ssdMobilenetv1.params) {
    console.log("Model not loaded");
    requestAnimationFrame(analyze);
  } else {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}
// isFaceDetectionModelLoaded
