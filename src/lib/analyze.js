import { getFaceapi } from './models.js';

const MIN_CONFIDENCE = 0.3;
const ACCENT_COLOR = '#818cf8';
const MASKED_COLOR = '#34d399';
const UNMASKED_COLOR = '#fb7185';

// Temporal smoothing — each tracked face keeps the last N raw classifications;
// the displayed label is the majority across that window. This kills the
// frame-to-frame flicker without delaying the box itself.
const WINDOW = 10;
// Matching threshold between consecutive frames' bounding boxes.
const MIN_IOU = 0.3;
// How many frames a track can be missing before we drop it.
const TRACK_TTL_FRAMES = 15;

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
    /**
     * Match the current frame's detections to existing tracks by IoU.
     * Returns an array of track refs aligned with the input boxes.
     */
    assign(boxes, frame) {
      const assigned = new Set();
      const result = new Array(boxes.length);

      for (let i = 0; i < boxes.length; i++) {
        let bestId = null;
        let bestScore = MIN_IOU;
        for (const [id, track] of tracks) {
          if (assigned.has(id)) continue;
          const score = iou(boxes[i], track.box);
          if (score > bestScore) {
            bestScore = score;
            bestId = id;
          }
        }
        if (bestId === null) {
          bestId = nextId++;
          tracks.set(bestId, { box: boxes[i], history: [], lastSeen: frame });
        }
        const track = tracks.get(bestId);
        track.box = boxes[i];
        track.lastSeen = frame;
        assigned.add(bestId);
        result[i] = track;
      }

      // GC stale tracks
      for (const [id, track] of tracks) {
        if (frame - track.lastSeen > TRACK_TTL_FRAMES) tracks.delete(id);
      }

      return result;
    },
    recordLabel(track, label) {
      track.history.push(label ?? null);
      if (track.history.length > WINDOW) track.history.shift();
    },
    smoothed(track) {
      return majority(track.history);
    },
  };
}

function classifyFace(maskBundle, faceCanvas) {
  const { tf, model, labels, height, width } = maskBundle;
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

function drawBox(ctx, box, color, label) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.stroke();

  if (label) {
    const pad = 6;
    ctx.font = "600 13px 'Inter Variable', system-ui, sans-serif";
    const metrics = ctx.measureText(label);
    const labelW = metrics.width + pad * 2;
    const labelH = 20;
    const labelY = Math.max(0, box.y - labelH);
    ctx.fillStyle = color;
    ctx.fillRect(box.x, labelY, labelW, labelH);
    ctx.fillStyle = '#0b1226';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, box.x + pad, labelY + labelH / 2);
  }
}

function colorForLabel(label) {
  if (label === 'With_Mask') return { color: MASKED_COLOR, text: 'Mask' };
  if (label === 'Without_Mask') return { color: UNMASKED_COLOR, text: 'No mask' };
  return { color: ACCENT_COLOR, text: '' };
}

/**
 * Per-frame detection + mask-classification loop with temporal smoothing.
 *
 * Each detected face is matched to a track (by IoU with the previous frame's
 * boxes). The track holds the last WINDOW raw classifications, and the
 * displayed label is the majority vote across that window. The box is drawn
 * immediately on detection in the *smoothed* color so the overlay stays
 * stable even when individual frame predictions wobble.
 */
export function startAnalyze({ video, canvas, maskModel, onStats, onReady }) {
  const ctx = canvas.getContext('2d');
  const state = { running: true, ready: false };
  const tracker = createTracker();
  let faceapi;
  let frameId = 0;

  const tick = async () => {
    if (!state.running) return;
    if (!faceapi) faceapi = await getFaceapi();
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

    // Paint each box with the *smoothed* label/color from its track's history.
    // For brand new tracks (no history yet) this falls back to the accent color.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let masked = 0;
    boxes.forEach((box, i) => {
      const smoothed = tracker.smoothed(trackRefs[i]);
      const { color, text } = colorForLabel(smoothed);
      drawBox(ctx, box, color, text);
      if (smoothed === 'With_Mask') masked += 1;
    });
    onStats?.({ faces: boxes.length, masked });

    // Run the raw per-frame classification and feed each result into its
    // track's history. The result of this is what stabilises future frames.
    if (maskModel && resized.length > 0) {
      try {
        const faces = await faceapi.extractFaces(video, detections);
        if (!state.running || myFrame !== frameId) return;

        faces.forEach((face, i) => {
          let raw = null;
          try {
            raw = classifyFace(maskModel, face);
          } catch {
            raw = null;
          }
          tracker.recordLabel(trackRefs[i], raw);
        });

        // Re-paint with the freshly-updated smoothed labels (only if this
        // is still the latest frame).
        if (!state.running || myFrame !== frameId) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let m = 0;
        boxes.forEach((box, i) => {
          const smoothed = tracker.smoothed(trackRefs[i]);
          const { color, text } = colorForLabel(smoothed);
          drawBox(ctx, box, color, text);
          if (smoothed === 'With_Mask') m += 1;
        });
        onStats?.({ faces: boxes.length, masked: m });
      } catch {
        /* swallow; next frame retries */
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
    get running() {
      return state.running;
    },
  };
}
