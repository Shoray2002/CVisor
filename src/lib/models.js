let faceapiPromise = null;
let faceModelPromise = null;
let landmarkPromise = null;
let recognitionPromise = null;

const FACE_MODEL_PATH = '/models/face';
const LANDMARK_MODEL_PATH = '/models/landmark';
const RECOGNITION_MODEL_PATH = '/models/recognition';

async function getFaceapi() {
  if (!faceapiPromise) {
    faceapiPromise = import('@vladmandic/face-api').then((m) => m.default ?? m);
  }
  return faceapiPromise;
}

export async function loadFaceModel() {
  if (!faceModelPromise) {
    faceModelPromise = (async () => {
      const faceapi = await getFaceapi();
      await faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODEL_PATH);
      return faceapi;
    })();
  }
  return faceModelPromise;
}

export async function loadLandmarkNet() {
  if (!landmarkPromise) {
    landmarkPromise = (async () => {
      const faceapi = await getFaceapi();
      await faceapi.nets.faceLandmark68Net.loadFromUri(LANDMARK_MODEL_PATH);
      return faceapi;
    })();
  }
  return landmarkPromise;
}

export async function loadRecognitionNet() {
  if (!recognitionPromise) {
    recognitionPromise = (async () => {
      const faceapi = await getFaceapi();
      await faceapi.nets.faceRecognitionNet.loadFromUri(RECOGNITION_MODEL_PATH);
      return faceapi;
    })();
  }
  return recognitionPromise;
}

/**
 * Loads every model needed for the live watchlist pipeline.
 * Detection (SSD MobileNet) + landmark net + recognition embeddings.
 */
export async function loadAllModels() {
  const [faceapi] = await Promise.all([loadFaceModel(), loadLandmarkNet(), loadRecognitionNet()]);
  return faceapi;
}

export { getFaceapi };
