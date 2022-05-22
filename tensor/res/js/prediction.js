async function makePredictionUsingSingleFrame(model, video) {
  return await model.estimateFaces(video, false);
}

async function predictWebcam(model, source, frame, box, metadata) {
  const prediction = await makePredictionUsingSingleFrame(model, source);
  for (let n = 0; n < prediction.length; n++) {
    const video_aspect_ratio = metadata.width / metadata.height;
    let pred = prediction[n];
    // scale the bounding box coordinates based on the actual video dimensions
    // let box_width = pred.box[2] - pred.box[0];
    // let box_height = pred.box[3] - pred.box[1];
    // let box_x = pred.box[0];
    // let box_y = pred.box[1];
    // let box_aspect_ratio = box_width / box_height;
    // if (box_aspect_ratio > video_aspect_ratio) {
    //   box_width = box_height * video_aspect_ratio;
    //   box_x -= (box_width - (pred.box[2] - pred.box[0])) / 2;
    // } else {
    //   box_height = box_width / video_aspect_ratio;
    //   box_y -= (box_height - (pred.box[3] - pred.box[1])) / 2;
    // }

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
