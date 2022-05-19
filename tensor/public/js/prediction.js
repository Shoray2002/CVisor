async function predictWebcam(model, video, ctx) {
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
        pred.bottomRight[0] - 80,
        pred.bottomRight[1] - 10
      );
    }
  });
}

export default predictWebcam;
