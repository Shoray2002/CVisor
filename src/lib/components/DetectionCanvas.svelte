<script>
  let {
    videoEl = $bindable(),
    canvasEl = $bindable(),
    autoplay = false,
    muted = true,
    playsinline = true,
    controls = false,
  } = $props();
</script>

<div
  class="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/30"
>
  <video bind:this={videoEl} {autoplay} {muted} {playsinline} {controls} class="block h-auto w-full"
  ></video>
  <canvas bind:this={canvasEl} class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
</div>
