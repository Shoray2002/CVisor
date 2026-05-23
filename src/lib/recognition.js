// Loosened from face-api's canonical 0.5 — that threshold is calibrated for
// 1:1 verification, but the smoothing window downstream already requires
// multiple agreeing frames before committing to an identity, so we can
// afford to be more permissive per-frame and let the aggregator filter.
export const RECOGNITION_THRESHOLD = 0.55;

export function euclideanDistance(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Run face-api's full pipeline (detection → landmarks → 128-d embedding)
 * against the current video frame. Returns an array of
 * { detection, descriptor } objects, one per detected face.
 */
export async function detectFacesWithDescriptors(faceapi, video, minConfidence = 0.3) {
  const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
  return faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors();
}

/**
 * Return every roster entry that the descriptor matches under the threshold,
 * paired with its distance. Used by the tracker's smoothing layer, which
 * picks an identity based on best min-distance across a window of frames
 * rather than per-frame argmin. Surfacing all candidates (not just the best)
 * lets the aggregator notice when the *same* face occasionally matches
 * weakly — that's the signal we want to retain across noisy frames.
 */
export function matchEmbeddingCandidates(descriptor, roster, threshold = RECOGNITION_THRESHOLD) {
  const out = [];
  for (const entry of roster) {
    const d = euclideanDistance(descriptor, entry.embedding);
    if (d < threshold) out.push({ id: entry.id, distance: d });
  }
  return out;
}

/**
 * Crop the face bounding box out of a source video/image to a small canvas,
 * suitable for storing as a roster thumbnail or an event thumbnail.
 */
export async function cropFaceToBlob(source, box, size = 96) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Pad the box a little for a more flattering thumbnail.
  const pad = Math.max(box.width, box.height) * 0.2;
  const sx = Math.max(0, box.x - pad);
  const sy = Math.max(0, box.y - pad);
  const sw = box.width + pad * 2;
  const sh = box.height + pad * 2;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85));
}
