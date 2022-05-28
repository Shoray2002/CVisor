const start = document.querySelector("#start");
const stop = document.querySelector("#stop");
const video_input = document.querySelector("#video-input");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
let run_status = false;
const SSD_MOBILENETV1 = "ssd_mobilenetv1";
let selectedFaceDetector = SSD_MOBILENETV1;
start.addEventListener("click", () => {
  run_status = true;
  analyze();
});
stop.addEventListener("click", () => {
  run_status = false;
});

// when video seeks to a new time, update the canvas to match
// video.addEventListener("pause", () => {
//   analyze();
//   run_status = false;
// });
// video.addEventListener("play", () => {
//   run_status = true;
// });

window.onload = function () {
  loadModel();
  console.log("Model loaded");
  video_input.addEventListener("change", function () {
    let file = this.files[0];
    let blobURL = URL.createObjectURL(file);
    video.src = blobURL;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });
};

async function loadModel() {
  await faceapi.loadSsdMobilenetv1Model("../res/models");
}

async function analyze() {
  if (run_status) {
    let minConfidence = 0.3;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let task = faceapi.detectAllFaces(video, options);
    // const result = await faceapi.detectSingleFace(video, options);
    const result = await task;
    console.log(result);
    const person_count = result.length;
    if (result) {
      const dims = faceapi.matchDimensions(canvas, video, true);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
    }
    requestAnimationFrame(analyze);
  } else {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}

// isFaceDetectionModelLoaded
