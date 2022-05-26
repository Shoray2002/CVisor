async function makePredictionUsingSingleFrame(model, video) {
  return await model.estimateFaces(video, false);
}

async function predictWebcam(model, source, ctx, metadata) {
  const prediction = await makePredictionUsingSingleFrame(model, source);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < prediction.length; i++) {
    const pred = prediction[i];
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
      ctx.fillStyle = "black";
      pred.landmarks.forEach((landmark) => {
        ctx.fillRect(landmark[0], landmark[1], 5, 5);
      });
      ctx.font = "24px Arial";
      ctx.fillStyle = "white";
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
    console.log(pred.probability * 100 + "%");
  }
}

export { predictWebcam };
