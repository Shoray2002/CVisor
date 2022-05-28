const video = document.getElementById("webcam");
const section = document.querySelector("section");
const enableWebcamButton = document.getElementById("webcamButton");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
const canvas = document.getElementById("canvas");
let model_status = false;

stop.addEventListener("click", () => {
  onPlay();
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
  await faceapi.loadTinyFaceDetectorModel(
    "https://www.rocksetta.com/tensorflowjs/saved-models/face-api-js/"
  );
  await faceapi.loadFaceLandmarkTinyModel(
    "https://www.rocksetta.com/tensorflowjs/saved-models/face-api-js/"
  );
}

function resizeCanvasAndResults(dimensions, canvas, results) {
  console.log(dimensions);
  dimensions instanceof HTMLVideoElement
    ? faceapi.getMediaDimensions(dimensions)
    : dimensions;
  const width = faceapi.getMediaDimensions(dimensions)._width;
  const height = faceapi.getMediaDimensions(dimensions)._height;
  console.log(width, height);
  canvas.width = width;
  canvas.height = height;
  return results.map((res) => res.forSize(width, height));
}

function drawDetections(dimensions, canvas, detections) {
  const resizedDetections = resizeCanvasAndResults(
    dimensions,
    canvas,
    detections
  );
  faceapi.drawDetection(canvas, resizedDetections);
}
function drawLandmarks(dimensions, canvas, results, withBoxes = false) {
  const resizedResults = resizeCanvasAndResults(dimensions, canvas, results);
  const drawBoxParams = {
    lineWidth: 2,
  };
  if (withBoxes) {
    console.log("with");
    faceapi.drawDetection(
      canvas,
      resizedResults.map((det) => det.detection),
      drawBoxParams
    );
  }
}

async function onPlay() {
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 128,
    scoreThreshold: 0.3,
  });
  let result = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks(true);
  if (result) {
    drawLandmarks(video, canvas, [result], true);
    // document.getElementById("myDiv01").innerHTML =
    //   "First of 68 face landmarks, x: " +
    //   Math.round(result._unshiftedLandmarks._positions[0]._x) +
    //   ", y: " +
    //   Math.round(result._unshiftedLandmarks._positions[0]._y) +
    //   "<br>";
  }

  setTimeout(() => onPlay());
}
