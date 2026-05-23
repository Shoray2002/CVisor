<script>
  import Select from './ui/Select.svelte';
  import Button from './ui/Button.svelte';
  import Webcam from '@lucide/svelte/icons/webcam';
  import Globe from '@lucide/svelte/icons/globe';

  let {
    mode = $bindable('webcam'),
    selectedCam = $bindable(''),
    hlsUrl = $bindable(''),
    cameras = [],
    onConnectHls,
  } = $props();

  const tabs = [
    { id: 'webcam', label: 'Webcam', icon: Webcam },
    { id: 'remote', label: 'Remote feed', icon: Globe },
  ];
</script>

<div class="flex flex-col gap-3">
  <div class="inline-flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 text-sm">
    {#each tabs as t (t.id)}
      {@const Icon = t.icon}
      <button
        type="button"
        onclick={() => (mode = t.id)}
        class={[
          'inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
          mode === t.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white',
        ].join(' ')}
        aria-pressed={mode === t.id}
      >
        <Icon size={14} />
        {t.label}
      </button>
    {/each}
  </div>

  {#if mode === 'webcam'}
    <div class="min-w-56 max-w-md">
      <Select
        bind:value={selectedCam}
        options={cameras}
        placeholder={cameras.length ? 'Select a camera' : 'No cameras found'}
      />
    </div>
  {:else}
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="url"
        bind:value={hlsUrl}
        placeholder="https://example.com/stream.m3u8"
        class="h-9 min-w-72 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
      />
      <Button size="sm" variant="secondary" onclick={() => onConnectHls?.(hlsUrl)}>Connect</Button>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>HLS (<code>.m3u8</code>) with CORS enabled.</span>
      <button
        type="button"
        class="rounded-md border border-white/10 px-2 py-0.5 text-slate-300 transition-colors hover:bg-white/5"
        onclick={() => {
          hlsUrl = 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8';
          onConnectHls?.(hlsUrl);
        }}
      >
        Try sample
      </button>
    </div>
    <p class="text-[11px] leading-relaxed text-slate-600">
      Note: streams without CORS headers will block on-device analysis. NVR streams typically
      require enabling CORS in the camera/NVR web UI.
    </p>
  {/if}
</div>
