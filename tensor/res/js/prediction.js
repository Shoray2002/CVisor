async function makePredictionUsingSingleFrame(model, video) {
  return await model.estimateFaces(video, false);
}

async function predictWebcam(model, source, frame, box) {
  const prediction = await makePredictionUsingSingleFrame(model, source);
  for (let n = 0; n < prediction.length; n++) {
    let pred = prediction[n];
    frame.innerText =
      "Prediction: " + `${Math.round(pred.probability * 2000) / 20}%`;
    frame.style =
      "margin-left: " +
      (pred.bottomRight[0] - 80) +
      "px; margin-top: " +
      (pred.bottomRight[1] - 10) +
      "px;";
    box.setAttribute("class", "highlighter");
    console.log(source.width / 640, source.height / 480);
    box.style =
      "left: " +
      pred.topLeft[0] +
      "px; top: " +
      pred.topLeft[1] +
      "px; width: " +
      (pred.bottomRight[0] - pred.topLeft[0]) +
      "px; height: " +
      (pred.bottomRight[1] - pred.topLeft[1]) +
      "px;";
  }
}

export { predictWebcam };
