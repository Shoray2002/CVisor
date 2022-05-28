const video = document.getElementById("webcam");
const section = document.querySelector("section");
const enableWebcamButton = document.getElementById("webcamButton");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
const canvas = document.getElementById("canvas");
let run_status = false;
const SSD_MOBILENETV1 = "ssd_mobilenetv1";
let selectedFaceDetector = SSD_MOBILENETV1;

start.addEventListener("click", () => {
  run_status = true;
  onPlay();
});
stop.addEventListener("click", () => {
  run_status = false;
});

window.onload = function () {
  loadModel();
  console.log("Model loaded");
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (err) {
      console.log("An error occurred: " + err);
    });
  section.classList.remove("invisible");
};

async function loadModel() {
  await faceapi.loadSsdMobilenetv1Model("../res/models");
}

async function onPlay() {
  if (run_status) {
    let minConfidence = 0.3;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let task = faceapi.detectAllFaces(video, options);
    // const result = await faceapi.detectSingleFace(video, options);
    const result = await task;
    console.log(result);
    if (result) {
      const dims = faceapi.matchDimensions(canvas, video, true);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
    }
    setTimeout(() => onPlay());
  } else {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}
// isFaceDetectionModelLoaded
