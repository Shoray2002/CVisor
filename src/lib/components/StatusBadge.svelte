<script>
  let { running = false, faces = 0, known = 0, unknown = 0, loitering = 0 } = $props();
</script>

<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
  <span class="flex items-center gap-2">
    {#if running}
      <span class="size-1.5 rounded-full bg-indigo-400 pulse-ring"></span>
      <span class="text-slate-300">Watching</span>
    {:else}
      <span class="size-1.5 rounded-full bg-slate-600"></span>
      <span>Idle</span>
    {/if}
  </span>

  <span class="text-slate-600">/</span>

  <span>
    <span class="tabular-nums text-slate-200">{faces}</span>
    {faces === 1 ? 'face' : 'faces'}
  </span>

  {#if faces > 0 || known > 0 || unknown > 0 || loitering > 0}
    <span class="flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-emerald-400"></span>
      <span class="tabular-nums text-slate-200">{known}</span>
      <span>known</span>
    </span>
    <span class="flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-rose-400"></span>
      <span class="tabular-nums text-slate-200">{unknown}</span>
      <span>unknown</span>
    </span>
    {#if loitering > 0}
      <span class="flex items-center gap-1.5">
        <span class="size-1.5 rounded-full bg-amber-400"></span>
        <span class="tabular-nums text-slate-200">{loitering}</span>
        <span>loitering</span>
      </span>
    {/if}
  {/if}
</div>
