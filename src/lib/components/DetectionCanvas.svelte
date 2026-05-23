<script>
  import { onMount, onDestroy } from 'svelte';

  let {
    videoEl = $bindable(),
    canvasEl = $bindable(),
    autoplay = false,
    muted = true,
    playsinline = true,
    controls = false,
  } = $props();

  let observer = null;

  /**
   * Keep the canvas's drawing buffer in lockstep with the displayed video
   * size, accounting for device pixel ratio. The CSS box is left to flex
   * naturally — only the intrinsic width/height attributes change here.
   */
  function syncCanvas() {
    if (!videoEl || !canvasEl) return;
    const rect = videoEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (w > 0 && h > 0 && (canvasEl.width !== w || canvasEl.height !== h)) {
      canvasEl.width = w;
      canvasEl.height = h;
    }
  }

  onMount(() => {
    observer = new ResizeObserver(syncCanvas);
    if (videoEl) observer.observe(videoEl);
    // Re-sync when the video element learns its intrinsic dimensions.
    videoEl?.addEventListener('loadedmetadata', syncCanvas);
    videoEl?.addEventListener('resize', syncCanvas);
    syncCanvas();
  });

  onDestroy(() => {
    observer?.disconnect();
    videoEl?.removeEventListener('loadedmetadata', syncCanvas);
    videoEl?.removeEventListener('resize', syncCanvas);
  });
</script>

<div
  class="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/30"
>
  <video bind:this={videoEl} {autoplay} {muted} {playsinline} {controls} class="block h-auto w-full"
  ></video>
  <canvas bind:this={canvasEl} class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
</div>
