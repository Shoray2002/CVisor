export const RECOGNITION_THRESHOLD = 0.5;

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

export function matchEmbedding(descriptor, roster, threshold = RECOGNITION_THRESHOLD) {
  let best = null;
  let bestDist = threshold;
  for (const entry of roster) {
    const d = euclideanDistance(descriptor, entry.embedding);
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  return best ? { id: best.id, name: best.name, distance: bestDist } : null;
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
