<script>
  let { events = [], onClear } = $props();

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function thumbUrl(blob) {
    return blob ? URL.createObjectURL(blob) : null;
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-medium tracking-wide text-slate-300 uppercase">Event log</h2>
    <div class="flex items-center gap-3 text-xs text-slate-500">
      <span class="tabular-nums">{events.length}</span>
      {#if onClear && events.length > 0}
        <button
          type="button"
          onclick={onClear}
          class="rounded-md px-1.5 py-0.5 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          Clear
        </button>
      {/if}
    </div>
  </div>

  {#if events.length === 0}
    <p
      class="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-500"
    >
      No events yet. Strangers and loitering get logged here.
    </p>
  {:else}
    <ul class="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
      {#each events as evt (evt.id)}
        <li class="glass flex items-center gap-3 rounded-lg p-2.5">
          {#if evt.thumbnail}
            {@const url = thumbUrl(evt.thumbnail)}
            <img
              src={url}
              alt=""
              class="size-12 shrink-0 rounded-md object-cover"
              onload={() => URL.revokeObjectURL(url)}
            />
          {:else}
            <div class="size-12 shrink-0 rounded-md bg-white/5"></div>
          {/if}
          <div class="min-w-0 flex-1">
            <p class="text-sm text-white">
              {#if evt.kind === 'stranger_arrived'}
                <span class="text-rose-300">Unknown face</span>
                <span class="text-slate-500">·</span>
                <span class="text-slate-400">track #{evt.trackId}</span>
              {:else if evt.kind === 'loiter'}
                <span class="text-amber-300">Loitering</span>
                <span class="text-slate-500">·</span>
                <span class="text-slate-300">{evt.name ?? `track #${evt.trackId}`}</span>
              {:else}
                <span>{evt.kind}</span>
              {/if}
            </p>
            <p class="text-xs text-slate-500">{timeAgo(evt.ts)}</p>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
