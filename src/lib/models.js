let tfPromise = null;
let faceapiPromise = null;
let faceModelPromise = null;
let maskBundlePromise = null;

const FACE_MODEL_PATH = '/models/face';
const MASK_MODEL_JSON = '/models/mask/model.json';
const MASK_METADATA_JSON = '/models/mask/metadata.json';

async function getTf() {
  if (!tfPromise) {
    tfPromise = import('@tensorflow/tfjs').then((m) => m.default ?? m);
  }
  return tfPromise;
}

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

export async function loadMaskClassifier() {
  if (!maskBundlePromise) {
    maskBundlePromise = (async () => {
      const [tf, metadata] = await Promise.all([
        getTf(),
        fetch(MASK_METADATA_JSON).then((r) => r.json()),
      ]);
      const model = await tf.loadLayersModel(MASK_MODEL_JSON);
      const inputShape = model.inputs[0].shape; // [batch, h, w, c]
      const h = inputShape[1] ?? 224;
      const w = inputShape[2] ?? 224;
      return { tf, model, labels: metadata.labels, height: h, width: w };
    })();
  }
  return maskBundlePromise;
}

export async function loadModels() {
  const [face, mask] = await Promise.all([loadFaceModel(), loadMaskClassifier()]);
  return { face, mask };
}

export { getFaceapi };
