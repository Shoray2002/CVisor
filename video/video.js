// picking up elements from the DOM
const start = document.querySelector("#start");
const stop = document.querySelector("#stop");
const video_input = document.querySelector("#video-input");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");
let run_status = false;
let mask_model;
// face mask classifier model
const model_URL = "https://teachablemachine.withgoogle.com/models/wJeEWVm8t/";

// start analysis
start.addEventListener("click", () => {
  if (video.src) {
    loadModel();
    run_status = true;
    analyze();
    // adding the loader
    body.classList.add("preload");
    loader.style.display = "flex";
    loader.style.backgroundColor = "#e4f0ff1b";
  }
});

// stop analysis
stop.addEventListener("click", () => {
  run_status = false;
});

// fires when the page is loaded
window.onload = function () {
  // when the video is uploaded
  video_input.addEventListener("change", function () {
    let file = this.files[0];
    let blobURL = URL.createObjectURL(file);
    video.src = blobURL;
    if (video.videoWidth > 640) {
      video.width = 640;
    }
    if (video.videoHeight > 480) {
      video.height = 480;
    }

    video.playbackRate = 0.25;
    // resizing the canvas to match the video
    canvas.width = video.width;
    canvas.height = video.height;
  });
  // removing the loader
  body.classList.remove("preload");
  loader.style.display = "none";
};

async function loadModel() {
  await faceapi.loadSsdMobilenetv1Model("../res/models");
  mask_model = await ml5.imageClassifier(model_URL + "model.json");
}

async function analyze() {
  if (run_status && faceapi.nets.ssdMobilenetv1.params && mask_model) {
    // removing the loader when the model is loaded
    body.classList.remove("preload");
    loader.style.display = "none";
    let minConfidence = 0.3;
    // create new model instance
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    let result, task;
    task = faceapi.detectAllFaces(video, options);
    result = await task;
    const dims = faceapi.matchDimensions(canvas, video, true);
    // resize the canvas to match the video
    const resizedResults = faceapi.resizeResults(result, dims);
    // extract the canvas of each detected face
    const facesCallback = faceapi.extractFaces(video, result);
    const faces = await facesCallback;
    if (result && faces.length > 0) {
      // loop through each face and classify it
      faces.forEach((face, i) => {
        var faceStatus;
        const faceCordinates = resizedResults[i]["_box"];
        const box = {
          x: faceCordinates._x,
          y: faceCordinates._y,
          width: faceCordinates._width,
          height: faceCordinates._height,
        };
        // draw a box around the face
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        ctx.textAlign = "start";
        ctx.textBaseline = "bottom";
        ctx.font = "bold 12px verdana, sans-serif";
        // classify the face as either with_mask or without_mask
        mask_model.classify(face, (err, verdict) => {
          faceStatus = verdict[0].label.toString();
          // if the face is not wearing a mask then draw a red label otherwise draw a green label
          ctx.fillStyle = faceStatus === "With_Mask" ? "green" : "red";
          ctx.fillText(faceStatus, box.x, box.y);
        });
      });
    }
    // call analyze each frame
    requestAnimationFrame(analyze);
  } else if (!faceapi.nets.ssdMobilenetv1.params) {
    console.log("FACE DETECTION MODEL not loaded");
    requestAnimationFrame(analyze);
  } else if (!mask_model) {
    console.log("MASK CLASSIFIER MODEL not loaded");
    requestAnimationFrame(analyze);
  } else {
    // clear the canvas
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}
