const options = new faceapi.TinyFaceDetectorOptions({
  inputSize: 128,
  scoreThreshold: 0.3,
});
let mask_status = localStorage.getItem("mask");
let dist_status = localStorage.getItem("dist");
let crowd_status = localStorage.getItem("crowd");
console.log(mask_status, dist_status, crowd_status);
if (mask_status == "false" && dist_status == "false") {
  localStorage.setItem("mask", "true");
  mask_status = true;
}
console.log(mask_status, dist_status, crowd_status);

await faceapi.loadTinyFaceDetectorModel(
  "https://www.rocksetta.com/tensorflowjs/saved-models/face-api-js/"
);
// when model is loaded
console.log("model loaded");


async function predictWebcam(source, ctx, metadata, status) {
  const result = await faceapi
    .detectSingleFace(source, options)
    .withFaceLandmarks(true);
  if (result) {
    console.log(result);
  }
}

export { predictWebcam };
