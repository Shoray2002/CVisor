<script>
  import { onDestroy } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import DetectionCanvas from '$lib/components/DetectionCanvas.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { loadAllModels } from '$lib/models.js';
  import { startAnalyze } from '$lib/analyze.js';
  import { listRoster, appendEvent } from '$lib/storage.js';
  import Upload from '@lucide/svelte/icons/upload';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';

  let videoEl = $state();
  let canvasEl = $state();
  let fileName = $state('');
  let loiterSeconds = $state(30);
  let stats = $state({ faces: 0, known: 0, unknown: 0, loitering: 0 });
  let running = $state(false);
  let loading = $state(false);
  let error = $state('');

  let session = null;
  let roster = [];

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileName = file.name;
    error = '';
    stopSession();
    videoEl.src = URL.createObjectURL(file);
    videoEl.playbackRate = 0.75;
    videoEl.controls = true;
    await videoEl.play().catch(() => {});
  }

  async function start() {
    if (!videoEl?.src) {
      error = 'Pick a video first.';
      return;
    }
    error = '';
    loading = true;
    try {
      await loadAllModels();
      roster = await listRoster();
      loading = false;
      running = true;
      videoEl.play().catch(() => {});
      session = startAnalyze({
        video: videoEl,
        canvas: canvasEl,
        getRoster: () => roster,
        getLoiterThresholdMs: () => loiterSeconds * 1000,
        onStats: (s) => (stats = s),
        onEvent: async (evt) => {
          await appendEvent(evt);
        },
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

  onDestroy(stopSession);
</script>

<Loader show={loading} label="Loading detection models…" />

<section class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Review</h1>
    <p class="max-w-xl text-sm text-slate-400">
      Run the same watchlist + dwell pipeline over an uploaded recording.
    </p>
  </header>

  <div class="flex flex-col gap-6">
    <DetectionCanvas bind:videoEl bind:canvasEl />

    <div class="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-4">
      <label
        class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 transition-colors hover:bg-white/[0.08]"
      >
        <Upload size={14} />
        {fileName ? 'Replace' : 'Choose video'}
        <input type="file" accept="video/*" class="hidden" onchange={handleFile} />
      </label>

      {#if fileName}
        <span class="truncate text-xs text-slate-500">{fileName}</span>
      {/if}

      <label class="flex items-center gap-2 text-xs text-slate-400">
        Dwell
        <input
          type="number"
          min="3"
          max="600"
          step="1"
          bind:value={loiterSeconds}
          class="h-8 w-16 rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        />
        <span class="text-slate-500">sec</span>
      </label>

      <div class="ml-auto">
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

    <div class="mx-auto w-full max-w-2xl">
      <StatusBadge
        {running}
        faces={stats.faces}
        known={stats.known}
        unknown={stats.unknown}
        loitering={stats.loitering}
      />
      {#if error}
        <p class="mt-3 text-sm text-rose-300">{error}</p>
      {/if}
    </div>
  </div>
</section>
