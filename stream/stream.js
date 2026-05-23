import { loadModels, startAnalyze } from "../res/js/analyze.js";

// DOM
const video = document.getElementById("webcam");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const selection = document.getElementById("select");
const canvas = document.getElementById("canvas");
const body = document.querySelector("body");
const loader = document.querySelector(".load-wrapper");

let mediaStream = null;
let session = null;
let setupToken = 0;
let lastSetupCam = "";

function showLoader() {
  body.classList.add("preload");
  loader.style.display = "flex";
  loader.style.backgroundColor = "#e4f0ff1b";
}

function hideLoader() {
  body.classList.remove("preload");
  loader.style.display = "none";
}

// Set up (or switch) the camera. Guarded against the rapid-change race —
// if a newer setUpCamera() is invoked while an older getUserMedia() is in
// flight, the older one drops its stream instead of clobbering the new one.
async function setUpCamera() {
  const desired = selection.value || "";
  if (desired === lastSetupCam && mediaStream) return;
  lastSetupCam = desired;
  const token = ++setupToken;

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: desired ? { deviceId: { exact: desired } } : true,
    });
    if (token !== setupToken) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    mediaStream = stream;
    video.srcObject = stream;
    // autoplay is set in the HTML; swallow the benign interrupt rejection.
    video.play().catch(() => {});
  } catch (err) {
    console.error("Camera setup failed:", err);
  }
}

async function startAnalysis() {
  if (!mediaStream) await setUpCamera();
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
selection.addEventListener("change", setUpCamera);

window.addEventListener("load", async () => {
  try {
    // Needed once so device labels populate.
    const probe = await navigator.mediaDevices.getUserMedia({ video: true });
    probe.getTracks().forEach((t) => t.stop());
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
      if (device.kind !== "videoinput") return;
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Camera ${selection.length}`;
      selection.appendChild(option);
    });
    await setUpCamera();
  } catch (err) {
    console.error("Could not enumerate cameras:", err);
  }
  hideLoader();
});
