<script>
  let { running = false, faces = 0, masked = 0 } = $props();
  let unmasked = $derived(faces - masked);
</script>

<div class="flex items-center gap-5 text-xs text-slate-400">
  <span class="flex items-center gap-2">
    {#if running}
      <span class="size-1.5 rounded-full bg-indigo-400 pulse-ring"></span>
      <span class="text-slate-300">Detecting</span>
    {:else}
      <span class="size-1.5 rounded-full bg-slate-600"></span>
      <span>Idle</span>
    {/if}
  </span>

  <span class="text-slate-600">/</span>

  <span>
    <span class="text-slate-200 tabular-nums">{faces}</span>
    {faces === 1 ? 'face' : 'faces'}
  </span>

  {#if faces > 0}
    <span class="flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-emerald-400"></span>
      <span class="tabular-nums text-slate-200">{masked}</span>
      <span>masked</span>
    </span>
    <span class="flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-rose-400"></span>
      <span class="tabular-nums text-slate-200">{unmasked}</span>
      <span>unmasked</span>
    </span>
  {/if}
</div>
