const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
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
  // Only continue if the COCO-SSD has finished loading.
  if (!model) {
    return;
  }
  // Hide the button once clicked.
  event.target.classList.add("removed");
  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

var model = undefined;
blazeface.load().then(function (loadedModel) {
  model = loadedModel;
  demosSection.classList.remove("invisible");
});

var children = [];
async function predictWebcam() {
  const prediction = await model.estimateFaces(video, false);
  ctx.drawImage(video, 0, 0, 640, 480);
  prediction.forEach((pred) => {
    if (pred.probability > 0.9) {
      ctx.beginPath();
      ctx.lineWidth = "4";
      ctx.strokeStyle = "#ff6f00d9";
      ctx.rect(
        pred.topLeft[0],
        pred.topLeft[1],
        pred.bottomRight[0] - pred.topLeft[0],
        pred.bottomRight[1] - pred.topLeft[1]
      );
      ctx.stroke();
      ctx.fillStyle = "whitesmoke";
      pred.landmarks.forEach((landmark) => {
        ctx.fillRect(landmark[0], landmark[1], 5, 5);
      });

      // display the probability
      ctx.font = "24px Arial";
      ctx.fillStyle = "whitesmoke";
      ctx.fillText(
        `${Math.round(pred.probability * 2000) / 20}%`,
        pred.bottomRight[0]-80,
        pred.bottomRight[1] - 10
      );
    }
  });
  window.requestAnimationFrame(predictWebcam);
}
