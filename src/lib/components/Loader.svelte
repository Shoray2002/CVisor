<script>
  let { label = 'Loading models…', show = true } = $props();
</script>

{#if show}
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/70 backdrop-blur-md"
    role="status"
    aria-live="polite"
  >
    <div class="relative h-14 w-14">
      <div
        class="absolute inset-0 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin"
      ></div>
      <div
        class="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/60 to-violet-500/60 blur-md"
      ></div>
    </div>
    <p class="text-sm tracking-wide text-slate-300">{label}</p>
  </div>
{/if}
