import { getFaceapi } from './models.js';
import {
  detectFacesWithDescriptors,
  matchEmbedding,
  cropFaceToBlob,
  euclideanDistance,
} from './recognition.js';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const MIN_CONFIDENCE = 0.3;

const ACCENT_COLOR = '#818cf8';
const KNOWN_COLOR = '#34d399';
const UNKNOWN_COLOR = '#fb7185';
const LOITER_COLOR = '#fbbf24';

const WINDOW = 10; // frames in the rolling identity vote
const MIN_IOU = 0.25; // primary track match between consecutive frames
const EMBED_TRACK_THRESHOLD = 0.55; // fallback descriptor-similarity match
const TRACK_TTL_FRAMES = 60; // a track survives this many frames unseen
const EMBED_BUFFER = 5; // descriptors averaged per track

const UNKNOWN_ID = '__unknown__';

// ---------------------------------------------------------------------------
// Geometry / stats helpers
// ---------------------------------------------------------------------------

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
    if (l === null || l === undefined) continue;
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

function meanEmbedding(buffer) {
  if (!buffer.length) return null;
  const dim = buffer[0].length;
  const out = new Float32Array(dim);
  for (const emb of buffer) {
    for (let i = 0; i < dim; i++) out[i] += emb[i];
  }
  for (let i = 0; i < dim; i++) out[i] /= buffer.length;
  return out;
}

function formatDwell(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

function createTracker() {
  const tracks = new Map();
  let nextId = 1;

  function pushEmbedding(track, descriptor) {
    track.embeddings.push(descriptor);
    if (track.embeddings.length > EMBED_BUFFER) track.embeddings.shift();
    track.meanEmbedding = meanEmbedding(track.embeddings);
  }

  return {
    assign(detections, frame, nowMs) {
      const assigned = new Set();
      const out = new Array(detections.length);

      for (let i = 0; i < detections.length; i++) {
        const { box, descriptor } = detections[i];
        let bestId = null;

        // 1) IoU match — fast, works for slow motion.
        let bestIou = MIN_IOU;
        for (const [id, track] of tracks) {
          if (assigned.has(id)) continue;
          const score = iou(box, track.box);
          if (score > bestIou) {
            bestIou = score;
            bestId = id;
          }
        }

        // 2) Descriptor-similarity fallback — handles fast head motion or
        //    brief disappearance where IoU breaks.
        if (bestId === null && descriptor) {
          let bestDist = EMBED_TRACK_THRESHOLD;
          for (const [id, track] of tracks) {
            if (assigned.has(id) || !track.meanEmbedding) continue;
            const d = euclideanDistance(descriptor, track.meanEmbedding);
            if (d < bestDist) {
              bestDist = d;
              bestId = id;
            }
          }
        }

        // 3) Fresh track.
        if (bestId === null) {
          bestId = nextId++;
          tracks.set(bestId, {
            id: bestId,
            box,
            history: [],
            embeddings: [],
            meanEmbedding: null,
            firstSeenMs: nowMs,
            lastSeen: frame,
            dwellMs: 0,
            loiterFlagged: false,
            strangerAnnounced: false,
          });
        }

        const track = tracks.get(bestId);
        track.box = box;
        track.lastSeen = frame;
        track.dwellMs = nowMs - track.firstSeenMs;
        if (descriptor) pushEmbedding(track, descriptor);
        assigned.add(bestId);
        out[i] = track;
      }

      for (const [id, track] of tracks) {
        if (frame - track.lastSeen > TRACK_TTL_FRAMES) tracks.delete(id);
      }

      return out;
    },
    recordMatch(track, identityId) {
      track.history.push(identityId);
      if (track.history.length > WINDOW) track.history.shift();
    },
    smoothed(track) {
      return majority(track.history);
    },
  };
}

// ---------------------------------------------------------------------------
// Canvas drawing — operates entirely in canvas-buffer pixels.
// ---------------------------------------------------------------------------

function drawBoxScaled(ctx, box, sx, sy, color, label) {
  const x = box.x * sx;
  const y = box.y * sy;
  const w = box.width * sx;
  const h = box.height * sy;
  const lineWidth = Math.max(2, 3 * Math.min(sx, sy));

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();

  if (label) {
    const pad = 6 * Math.min(sx, sy);
    const fontPx = Math.max(11, 13 * Math.min(sx, sy));
    ctx.font = `600 ${fontPx}px 'Inter Variable', system-ui, sans-serif`;
    const metrics = ctx.measureText(label);
    const labelW = metrics.width + pad * 2;
    const labelH = fontPx + pad;
    const labelY = Math.max(0, y - labelH);
    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, labelW, labelH);
    ctx.fillStyle = '#0b1226';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + pad, labelY + labelH / 2);
  }
}

function colorForTrack(track, smoothed, rosterById, isLoiter) {
  if (isLoiter) {
    const knownName =
      smoothed && smoothed !== UNKNOWN_ID ? rosterById.get(smoothed)?.name : null;
    return {
      color: LOITER_COLOR,
      label: `${knownName ?? 'Loitering'} · ${formatDwell(track.dwellMs)}`,
    };
  }
  if (smoothed && smoothed !== UNKNOWN_ID) {
    const entry = rosterById.get(smoothed);
    return { color: KNOWN_COLOR, label: entry?.name ?? 'Known' };
  }
  if (smoothed === UNKNOWN_ID) {
    return { color: UNKNOWN_COLOR, label: `Unknown #${track.id}` };
  }
  return { color: ACCENT_COLOR, label: '' };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

export function startAnalyze({
  video,
  canvas,
  getRoster = () => [],
  getLoiterThresholdMs = () => 60_000,
  onStats,
  onEvent,
  onError,
}) {
  const ctx = canvas.getContext('2d');
  const state = { running: true };
  const tracker = createTracker();
  let faceapi;
  let frameId = 0;
  let errorReported = false;

  function emitEvent(track, payload, sourceBox) {
    if (!onEvent) return;
    // Crop is taken from the *video* in its native coordinate space.
    cropFaceToBlob(video, sourceBox).then((thumbnail) => {
      onEvent({ ...payload, trackId: track.id, thumbnail });
    });
  }

  const tick = async () => {
    if (!state.running) return;
    if (!faceapi) faceapi = await getFaceapi();
    if (!video.videoWidth || video.readyState < 2) {
      if (state.running) requestAnimationFrame(tick);
      return;
    }
    if (!canvas.width || !canvas.height) {
      // Canvas hasn't been sized yet — try again next frame.
      if (state.running) requestAnimationFrame(tick);
      return;
    }

    const myFrame = ++frameId;
    const nowMs = performance.now();

    let results;
    try {
      results = await detectFacesWithDescriptors(faceapi, video, MIN_CONFIDENCE);
    } catch (err) {
      if (!errorReported) {
        errorReported = true;
        const msg = /tainted|cross-origin|SecurityError/i.test(err?.message ?? String(err))
          ? 'This stream blocks on-device analysis (CORS). Try a different feed.'
          : `Detection failed: ${err?.message ?? err}`;
        console.error('[analyze]', err);
        onError?.(msg);
      }
      if (state.running) requestAnimationFrame(tick);
      return;
    }
    if (!state.running || myFrame !== frameId) return;

    // Detection coordinates come back in the video's native coordinate
    // system. Compute the scale to map them into the canvas's buffer.
    const sx = canvas.width / video.videoWidth;
    const sy = canvas.height / video.videoHeight;

    const detections = results.map((r) => ({
      box: r.detection.box,
      descriptor: r.descriptor,
    }));
    const trackRefs = tracker.assign(detections, myFrame, nowMs);

    const roster = getRoster();
    const rosterById = new Map(roster.map((r) => [r.id, r]));

    // Roster match each face, push into the track's identity history.
    results.forEach((r, i) => {
      const match = matchEmbedding(r.descriptor, roster);
      tracker.recordMatch(trackRefs[i], match ? match.id : UNKNOWN_ID);
    });

    // Paint.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let known = 0;
    let unknown = 0;
    let loitering = 0;
    const loiterMs = getLoiterThresholdMs();

    for (let i = 0; i < detections.length; i++) {
      const track = trackRefs[i];
      const smoothed = tracker.smoothed(track);
      const isLoiter = track.dwellMs >= loiterMs;
      const { color, label } = colorForTrack(track, smoothed, rosterById, isLoiter);
      drawBoxScaled(ctx, detections[i].box, sx, sy, color, label);
      if (isLoiter) loitering++;
      else if (smoothed === UNKNOWN_ID) unknown++;
      else if (smoothed && smoothed !== UNKNOWN_ID) known++;
    }
    onStats?.({ faces: detections.length, known, unknown, loitering });

    // Fire events for newly-confirmed strangers and freshly-loitering tracks.
    for (let i = 0; i < trackRefs.length; i++) {
      const track = trackRefs[i];
      const smoothed = tracker.smoothed(track);

      if (
        !track.strangerAnnounced &&
        smoothed === UNKNOWN_ID &&
        track.history.length >= Math.min(WINDOW, 5)
      ) {
        track.strangerAnnounced = true;
        emitEvent(
          track,
          { kind: 'stranger_arrived', identityId: null, name: null },
          detections[i].box,
        );
      }

      if (!track.loiterFlagged && track.dwellMs >= loiterMs) {
        track.loiterFlagged = true;
        const name = smoothed && smoothed !== UNKNOWN_ID ? rosterById.get(smoothed)?.name : null;
        emitEvent(
          track,
          {
            kind: 'loiter',
            identityId: smoothed && smoothed !== UNKNOWN_ID ? smoothed : null,
            name: name ?? null,
          },
          detections[i].box,
        );
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
