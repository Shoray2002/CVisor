function clearVideo(videoEl) {
  try {
    videoEl.pause();
  } catch {
    /* noop */
  }
  videoEl.removeAttribute('src');
  videoEl.srcObject = null;
  videoEl.load?.();
}

// hls.js is ~70 KB gzipped; only pull it in when an HLS stream is actually picked.
let hlsModulePromise = null;
async function getHls() {
  if (!hlsModulePromise) {
    hlsModulePromise = import('hls.js').then((m) => m.default ?? m);
  }
  return hlsModulePromise;
}

/**
 * Attach a getUserMedia camera stream to videoEl.
 * Returns a session with stop() that releases the camera.
 */
export async function useWebcam(videoEl, deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
  });
  clearVideo(videoEl);
  // Webcam streams aren't subject to CORS; clearing this prevents stale
  // crossOrigin state from a prior HLS session blocking webcam playback.
  videoEl.crossOrigin = null;
  videoEl.srcObject = stream;
  videoEl.play().catch(() => {});
  return {
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      clearVideo(videoEl);
    },
  };
}

/**
 * Attach an HLS (m3u8) source to videoEl. Uses hls.js everywhere except
 * Safari, which has native HLS support — there we set videoEl.src directly.
 *
 * onError is invoked with a short string message when the stream fails.
 */
export async function useHls(videoEl, url, { onError } = {}) {
  clearVideo(videoEl);
  // Request CORS-friendly delivery so that face-api can read pixels via
  // canvas without tainting it. Streams without CORS headers will simply
  // refuse to load, which is the right failure mode for our use case.
  videoEl.crossOrigin = 'anonymous';

  // Safari / iOS: native HLS via the <video> element itself.
  if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.src = url;
    const errorHandler = () => onError?.('Stream failed to load (network or CORS).');
    videoEl.addEventListener('error', errorHandler);
    videoEl.play().catch(() => {});
    return {
      stop() {
        videoEl.removeEventListener('error', errorHandler);
        clearVideo(videoEl);
      },
    };
  }

  const Hls = await getHls();
  if (!Hls.isSupported()) {
    onError?.('Your browser does not support HLS streams.');
    return { stop() {} };
  }

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    xhrSetup: (xhr) => {
      xhr.withCredentials = false;
    },
  });
  hls.loadSource(url);
  hls.attachMedia(videoEl);

  hls.on(Hls.Events.ERROR, (_, data) => {
    if (data.fatal) {
      onError?.(data.details ?? 'Stream error');
    }
  });

  videoEl.play().catch(() => {});

  return {
    stop() {
      hls.destroy();
      clearVideo(videoEl);
    },
  };
}
