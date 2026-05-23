import { loadModels, startAnalyze } from "../res/js/analyze.js";

// DOM
const start = document.querySelector("#start");
const stop = document.querySelector("#stop");
const video_input = document.querySelector("#video-input");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");

let session = null;

function showLoader() {
  body.classList.add("preload");
  loader.style.display = "flex";
  loader.style.backgroundColor = "#e4f0ff1b";
}

function hideLoader() {
  body.classList.remove("preload");
  loader.style.display = "none";
}

async function startAnalysis() {
  if (!video.src) return;
  showLoader();
  try {
    const { mask } = await loadModels();
    session?.stop();
    session = startAnalyze({
      video,
      canvas,
      mask,
      onReady: hideLoader,
    });
  } catch (err) {
    console.error("Failed to start detection:", err);
    hideLoader();
  }
}

function stopAnalysis() {
  session?.stop();
  session = null;
}

start.addEventListener("click", startAnalysis);
stop.addEventListener("click", stopAnalysis);

window.addEventListener("load", () => {
  video_input.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    stopAnalysis();
    video.src = URL.createObjectURL(file);
    if (video.videoWidth > 640) video.width = 640;
    if (video.videoHeight > 480) video.height = 480;
    video.playbackRate = 0.25;
    canvas.width = video.width;
    canvas.height = video.height;
  });
  hideLoader();
});
