<script>
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import DetectionCanvas from '$lib/components/DetectionCanvas.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { loadModels } from '$lib/models.js';
  import { startAnalyze } from '$lib/analyze.js';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';

  let videoEl = $state();
  let canvasEl = $state();
  let cameras = $state([]);
  let selectedCam = $state('');
  let mediaStream = $state(null);
  let stats = $state({ faces: 0, masked: 0 });
  let running = $state(false);
  let loading = $state(false);
  let error = $state('');

  let session = null;
  let setupToken = 0;
  let lastSetupCam = '';

  async function loadCameras() {
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: true });
      probe.getTracks().forEach((t) => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameras = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      if (cameras.length && !selectedCam) selectedCam = cameras[0].value;
    } catch {
      error = 'Camera permission denied or no camera available.';
    }
  }

  async function setUpCamera() {
    if (!videoEl || !selectedCam) return;
    if (selectedCam === lastSetupCam && mediaStream) return;
    lastSetupCam = selectedCam;
    const token = ++setupToken;

    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCam } },
      });
      if (token !== setupToken) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStream = stream;
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    } catch (err) {
      error = err?.message ?? 'Unable to start camera.';
    }
  }

  async function start() {
    error = '';
    if (!mediaStream) await setUpCamera();
    loading = true;
    try {
      const { mask } = await loadModels();
      loading = false;
      running = true;
      session = startAnalyze({
        video: videoEl,
        canvas: canvasEl,
        maskModel: mask,
        onStats: (s) => (stats = s),
      });
    } catch (err) {
      loading = false;
      error = err?.message ?? 'Failed to load models.';
    }
  }

  function stopSession() {
    session?.stop();
    session = null;
    running = false;
    stats = { faces: 0, masked: 0 };
  }

  function tearDown() {
    stopSession();
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
  }

  onMount(loadCameras);
  onDestroy(tearDown);

  $effect(() => {
    if (selectedCam && videoEl) setUpCamera();
  });
</script>

<Loader show={loading} label="Loading detection models…" />

<section class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Stream</h1>
    <p class="max-w-xl text-sm text-slate-400">
      Real-time detection from your webcam. Frames stay on your device.
    </p>
  </header>

  <div class="flex flex-col gap-6">
    <DetectionCanvas bind:videoEl bind:canvasEl autoplay muted playsinline />

    <div class="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-4">
      <div class="min-w-56 flex-1">
        <Select
          bind:value={selectedCam}
          options={cameras}
          placeholder={cameras.length ? 'Select a camera' : 'No cameras found'}
        />
      </div>

      <div>
        {#if !running}
          <Button onclick={start} disabled={loading || !cameras.length} size="sm">
            <Play size={14} />
            Start
          </Button>
        {:else}
          <Button variant="secondary" onclick={stopSession} size="sm">
            <Square size={14} />
            Stop
          </Button>
        {/if}
      </div>
    </div>

    <div class="mx-auto w-full max-w-2xl">
      <StatusBadge {running} faces={stats.faces} masked={stats.masked} />
      {#if error}
        <p class="mt-3 text-sm text-rose-300">{error}</p>
      {/if}
    </div>
  </div>
</section>
