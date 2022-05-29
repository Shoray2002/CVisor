const start = document.querySelector("#start");
const stop = document.querySelector("#stop");
const video_input = document.querySelector("#video-input");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");
const model_URL = "https://teachablemachine.withgoogle.com/models/wJeEWVm8t/";
let run_status = false;
let crowd_status = localStorage.getItem("crowd");
let mask_model;
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

window.onload = function () {
  video_input.addEventListener("change", function () {
    let file = this.files[0];
    let blobURL = URL.createObjectURL(file);
    video.src = blobURL;
    // canvas.width = video.videoWidth;
    // canvas.height = video.videoHeight;
    // set canvas size to video element size
    canvas.width = video.width;
    canvas.height = video.height;
  });
  body.classList.remove("preload");
  loader.style.display = "none";
};

async function loadModel() {
  await faceapi.loadSsdMobilenetv1Model("../res/models");
  mask_model = await ml5.imageClassifier(model_URL + "model.json");
}

async function analyze() {
  if (run_status && faceapi.nets.ssdMobilenetv1.params && mask_model) {
    body.classList.remove("preload");
    loader.style.display = "none";
    let minConfidence = 0.3;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let result, task;
    if (crowd_status === "true") {
      console.log("Detect All Faces");
      task = faceapi.detectAllFaces(video, options);
    } else {
      console.log("Detecting Single Face");
      task = faceapi.detectSingleFace(video, options);
    }
    result = await task;
    const dims = faceapi.matchDimensions(canvas, video, true);
    const resizedResults = faceapi.resizeResults(result, dims);
    const facesCallback = faceapi.extractFaces(video, result);
    const faces = await facesCallback;
    if (result && faces.length > 0) {
      faces.forEach((face, i) => {
        var faceStatus;
        const faceCordinates = resizedResults[i]["_box"];
        const box = {
          x: faceCordinates._x,
          y: faceCordinates._y,
          width: faceCordinates._width,
          height: faceCordinates._height,
        };
        let ctx = canvas.getContext("2d");
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        ctx.textAlign = "start";
        ctx.textBaseline = "bottom";
        ctx.font = "bold 12px verdana, sans-serif";
        mask_model.classify(face, (err, verdict) => {
          faceStatus = verdict[0].label.toString();
          ctx.fillStyle = faceStatus === "With_Mask" ? "green" : "red";
          ctx.fillText(faceStatus, box.x, box.y);
        });
      });
    }
    requestAnimationFrame(analyze);
  } else if (!faceapi.nets.ssdMobilenetv1.params) {
    console.log("FACE DETECTION MODEL not loaded");
    requestAnimationFrame(analyze);
  } else if (!mask_model) {
    console.log("MASK CLASSIFIER MODEL not loaded");
    requestAnimationFrame(analyze);
  } else {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}
