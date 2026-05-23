// Shared detection + mask-classification pipeline for both /video and /stream.
// ESM, no build step — face-api and its bundled TFJS come from esm.sh.

import * as faceapi from "https://esm.sh/@vladmandic/face-api@1.7.14";

const tf = faceapi.tf;

// Paths are relative to the calling page (/video/ or /stream/).
const FACE_MODEL_URL = "../res/models";
const MASK_MODEL_JSON = "../res/models/mask/model.json";
const MASK_METADATA_JSON = "../res/models/mask/metadata.json";

// Tunables for the temporal smoother.
const WINDOW = 10;            // last N raw labels per face
const MIN_IOU = 0.3;          // box-overlap threshold to associate frames
const TRACK_TTL_FRAMES = 15;  // drop tracks unseen for this many frames
const MIN_CONFIDENCE = 0.3;   // face-api detector threshold

// ---------- model loading (memoised) ----------

let faceModelPromise = null;
let maskBundlePromise = null;

function loadFaceModel() {
  if (!faceModelPromise) {
    faceModelPromise = faceapi.nets.ssdMobilenetv1
      .loadFromUri(FACE_MODEL_URL)
      .then(() => faceapi);
  }
  return faceModelPromise;
}

function loadMaskBundle() {
  if (!maskBundlePromise) {
    maskBundlePromise = (async () => {
      const [model, metadata] = await Promise.all([
        tf.loadLayersModel(MASK_MODEL_JSON),
        fetch(MASK_METADATA_JSON).then((r) => r.json()),
      ]);
      const inputShape = model.inputs[0].shape; // [batch, h, w, c]
      return {
        model,
        labels: metadata.labels,
        height: inputShape[1] ?? 224,
        width: inputShape[2] ?? 224,
      };
    })();
  }
  return maskBundlePromise;
}

export async function loadModels() {
  const [face, mask] = await Promise.all([loadFaceModel(), loadMaskBundle()]);
  return { face, mask };
}

// ---------- mask classifier (direct TFJS) ----------

function classifyFace(maskBundle, faceCanvas) {
  const { model, labels, height, width } = maskBundle;
  const probs = tf.tidy(() => {
    const img = tf.browser
      .fromPixels(faceCanvas)
      .resizeBilinear([height, width])
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims(0);
    return Array.from(model.predict(img).dataSync());
  });
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > bestScore) {
      bestScore = probs[i];
      bestIdx = i;
    }
  }
  return labels[bestIdx] ?? null;
}

// ---------- IoU tracker + rolling-window majority vote ----------

function iou(a, b) {
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(a.x + a.width, b.x + b.width);
  const iy2 = Math.min(a.y + a.height, b.y + b.height);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  if (inter === 0) return 0;
  const union = a.width * a.height + b.width * b.height - inter;
  return inter / union;
}

function majority(history) {
  const counts = new Map();
  for (const l of history) {
    if (!l) continue;
    counts.set(l, (counts.get(l) ?? 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [k, v] of counts) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return best;
}

function createTracker() {
  const tracks = new Map(); // id -> { box, history, lastSeen }
  let nextId = 1;
  return {
    assign(boxes, frame) {
      const assigned = new Set();
      const result = new Array(boxes.length);
      for (let i = 0; i < boxes.length; i++) {
        let bestId = null;
        let bestScore = MIN_IOU;
        for (const [id, track] of tracks) {
          if (assigned.has(id)) continue;
          const s = iou(boxes[i], track.box);
          if (s > bestScore) {
            bestScore = s;
            bestId = id;
          }
        }
        if (bestId === null) {
          bestId = nextId++;
          tracks.set(bestId, { box: boxes[i], history: [], lastSeen: frame });
        }
        const t = tracks.get(bestId);
        t.box = boxes[i];
        t.lastSeen = frame;
        assigned.add(bestId);
        result[i] = t;
      }
      for (const [id, t] of tracks) {
        if (frame - t.lastSeen > TRACK_TTL_FRAMES) tracks.delete(id);
      }
      return result;
    },
    record(track, label) {
      track.history.push(label ?? null);
      if (track.history.length > WINDOW) track.history.shift();
    },
    smoothed(track) {
      return majority(track.history);
    },
  };
}

// ---------- drawing ----------

function drawBox(ctx, box, label) {
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.stroke();
  if (label) {
    ctx.textAlign = "start";
    ctx.textBaseline = "bottom";
    ctx.font = "bold 12px verdana, sans-serif";
    ctx.fillStyle = label === "With_Mask" ? "green" : "red";
    ctx.fillText(label, box.x, box.y);
  }
}

// ---------- public API ----------

/**
 * Start a per-frame detect + classify loop against `video`, drawing onto
 * `canvas`. Boxes are drawn the moment a face is detected; the mask label
 * is the majority vote across the last WINDOW raw classifications for
 * that tracked face, so frame-to-frame predictions don't flicker.
 *
 * Pass `onStats` to receive { faces, masked } once per frame.
 * Returns { stop } to halt the loop and clear the canvas.
 */
export function startAnalyze({ video, canvas, mask, onStats, onReady }) {
  const ctx = canvas.getContext("2d");
  const tracker = createTracker();
  const state = { running: true, ready: false };
  let frameId = 0;

  const tick = async () => {
    if (!state.running) return;
    if (!video.videoWidth || video.readyState < 2) {
      if (state.running) requestAnimationFrame(tick);
      return;
    }

    if (!state.ready) {
      state.ready = true;
      onReady?.();
    }

    const myFrame = ++frameId;
    const dims = faceapi.matchDimensions(canvas, video, true);
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_CONFIDENCE });
    const detections = await faceapi.detectAllFaces(video, options);
    if (!state.running || myFrame !== frameId) return;

    const resized = faceapi.resizeResults(detections, dims);
    const boxes = resized.map((d) => d.box);
    const trackRefs = tracker.assign(boxes, myFrame);

    // Paint with currently-smoothed labels (may still be null for new tracks).
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let masked = 0;
    boxes.forEach((box, i) => {
      const label = tracker.smoothed(trackRefs[i]);
      drawBox(ctx, box, label);
      if (label === "With_Mask") masked++;
    });
    onStats?.({ faces: boxes.length, masked });

    // Classify each face this frame and feed the result into its track,
    // then redraw with the freshly-updated majority vote.
    if (mask && resized.length > 0) {
      try {
        const faces = await faceapi.extractFaces(video, detections);
        if (!state.running || myFrame !== frameId) return;

        faces.forEach((face, i) => {
          let raw = null;
          try {
            raw = classifyFace(mask, face);
          } catch {
            raw = null;
          }
          tracker.record(trackRefs[i], raw);
        });

        if (!state.running || myFrame !== frameId) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let m = 0;
        boxes.forEach((box, i) => {
          const label = tracker.smoothed(trackRefs[i]);
          drawBox(ctx, box, label);
          if (label === "With_Mask") m++;
        });
        onStats?.({ faces: boxes.length, masked: m });
      } catch {
        /* next frame will retry */
      }
    }

    if (state.running) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  return {
    stop() {
      state.running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
