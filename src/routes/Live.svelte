<script>
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import DetectionCanvas from '$lib/components/DetectionCanvas.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import SourcePicker from '$lib/components/SourcePicker.svelte';
  import EventLog from '$lib/components/EventLog.svelte';
  import { loadAllModels } from '$lib/models.js';
  import { startAnalyze } from '$lib/analyze.js';
  import { useWebcam, useHls } from '$lib/sources.js';
  import { listRoster, appendEvent, listEvents, clearEvents } from '$lib/storage.js';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';

  let videoEl = $state();
  let canvasEl = $state();
  let mode = $state('webcam');
  let cameras = $state([]);
  let selectedCam = $state('');
  let hlsUrl = $state('');
  let loiterSeconds = $state(60);
  let stats = $state({ faces: 0, known: 0, unknown: 0, loitering: 0 });
  let events = $state([]);
  let running = $state(false);
  let loading = $state(false);
  let error = $state('');

  let session = null;
  let feedSession = null;
  let roster = [];

  async function refreshRoster() {
    roster = await listRoster();
  }

  async function refreshEvents() {
    events = await listEvents({ limit: 50 });
  }

  async function enumerateCameras() {
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: true });
      probe.getTracks().forEach((t) => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameras = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      if (cameras.length && !selectedCam) selectedCam = cameras[0].value;
    } catch {
      /* user can still use remote/demo modes */
    }
  }

  async function attachFeed() {
    if (feedSession) {
      feedSession.stop();
      feedSession = null;
    }
    error = '';
    try {
      if (mode === 'webcam') {
        if (!selectedCam) return;
        feedSession = await useWebcam(videoEl, selectedCam);
      } else if (mode === 'remote') {
        if (!hlsUrl.trim() || !hlsUrl.includes('.m3u8')) {
          error = 'Enter a valid .m3u8 URL.';
          return;
        }
        feedSession = await useHls(videoEl, hlsUrl.trim(), {
          onError: (msg) => (error = msg),
        });
      }
    } catch (err) {
      error = err?.message ?? 'Failed to attach feed.';
    }
  }

  async function start() {
    error = '';
    if (!feedSession) await attachFeed();
    if (error) return;
    loading = true;
    try {
      await loadAllModels();
      await refreshRoster();
      loading = false;
      running = true;
      session = startAnalyze({
        video: videoEl,
        canvas: canvasEl,
        getRoster: () => roster,
        getLoiterThresholdMs: () => loiterSeconds * 1000,
        onStats: (s) => (stats = s),
        onEvent: async (evt) => {
          await appendEvent(evt);
          await refreshEvents();
        },
        onError: (msg) => (error = msg),
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
    stats = { faces: 0, known: 0, unknown: 0, loitering: 0 };
  }

  function tearDown() {
    stopSession();
    feedSession?.stop();
    feedSession = null;
  }

  onMount(async () => {
    await enumerateCameras();
    await refreshEvents();
  });

  onDestroy(tearDown);

  $effect(() => {
    if (!videoEl) return;
    if (mode === 'webcam' && selectedCam) attachFeed();
  });

  function handleConnectHls(url) {
    hlsUrl = url;
    attachFeed();
  }

  async function handleClearEvents() {
    await clearEvents();
    await refreshEvents();
  }
</script>

<Loader show={loading} label="Loading detection models…" />

<section class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Live</h1>
    <p class="max-w-xl text-sm text-slate-400">
      Watch a feed, get green boxes for enrolled faces, rose for strangers, amber when someone
      lingers past the dwell threshold.
    </p>
  </header>

  <SourcePicker bind:mode bind:selectedCam bind:hlsUrl {cameras} onConnectHls={handleConnectHls} />

  <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-5">
      <DetectionCanvas bind:videoEl bind:canvasEl autoplay muted playsinline />

      <div class="flex flex-wrap items-center justify-between gap-4">
        <label class="flex items-center gap-2 text-xs text-slate-400">
          Dwell threshold
          <input
            type="number"
            min="5"
            max="600"
            step="5"
            bind:value={loiterSeconds}
            class="h-8 w-20 rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
          <span class="text-slate-500">sec</span>
        </label>

        <div>
          {#if !running}
            <Button onclick={start} disabled={loading} size="sm">
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

      <StatusBadge
        {running}
        faces={stats.faces}
        known={stats.known}
        unknown={stats.unknown}
        loitering={stats.loitering}
      />

      {#if error}
        <p class="text-sm text-rose-300">{error}</p>
      {/if}
    </div>

    <EventLog {events} onClear={handleClearEvents} />
  </div>
</section>
