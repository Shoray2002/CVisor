const video = document.getElementById("webcam");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
const canvas = document.getElementById("canvas");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");
let run_status = false;
let crowd_status = localStorage.getItem("crowd");
let selectedCam, mask_model;
const URL = "https://teachablemachine.withgoogle.com/models/wJeEWVm8t/";
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";
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
  mask_model = await ml5.imageClassifier(URL + "model.json");
}

async function analyze() {
  if (run_status && faceapi.nets.ssdMobilenetv1.params && mask_model) {
    body.classList.remove("preload");
    loader.style.display = "none";
    let minConfidence = 0.3;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let result, task;
    if (crowd_status === "true") {
      task = faceapi.detectAllFaces(video, options);
    } else {
      task = faceapi.detectSingleFace(video, options);
    }
    result = await task;
    const facesCallback = faceapi.extractFaces(video, result);
    const faces = await facesCallback;
    if (result && faces.length > 0) {
      console.log(faces);
      mask_model.classify(faces[0], (err, results) => {
        console.log(results);
      });
      const dims = faceapi.matchDimensions(canvas, video, true);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
    }
    requestAnimationFrame(analyze);
  } else if (!faceapi.nets.ssdMobilenetv1.params) {
    console.log("Model not loaded");
    requestAnimationFrame(analyze);
  } else if (!mask_model) {
    console.log("mask not loaded");
    requestAnimationFrame(analyze);
  } else {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}
