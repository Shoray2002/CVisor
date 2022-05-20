async function makePredictionUsingSingleFrame(model, video) {
  return await model.estimateFaces(video, false);
}

async function predictWebcam(model, source, ctx) {
  const prediction = await makePredictionUsingSingleFrame(model, source);
  let pred = prediction[0];
  ctx.drawImage(source, 0, 0, source.width, source.height);
  if (pred.probability && pred.probability > 0.9) {
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

    ctx.font = "24px Arial";
    ctx.fillStyle = "whitesmoke";
    ctx.fillText(
      `${Math.round(pred.probability * 2000) / 20}%`,
      pred.bottomRight[0] - 80,
      pred.bottomRight[1] - 10
    );
  } else {
    ctx.font = "24px Arial";
    ctx.fillStyle = "whitesmoke";
    ctx.fillText(
      `${Math.round(pred.probability * 2000) / 20}%`,
      pred.bottomRight[0] - 80,
      pred.bottomRight[1] - 10
    );
  }
}

export { predictWebcam };
