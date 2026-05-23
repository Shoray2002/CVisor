<script>
  import { cn } from '$lib/utils.js';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Select…',
    disabled = false,
    class: className = '',
  } = $props();
</script>

<div class={cn('relative', className)}>
  <select
    bind:value
    {disabled}
    class={cn(
      'w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10',
      'text-sm text-white shadow-inner shadow-black/20 backdrop-blur-md',
      'focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-400/50',
      'disabled:opacity-50 disabled:pointer-events-none transition-colors',
    )}
  >
    {#if placeholder}
      <option value="" disabled selected={!value}>{placeholder}</option>
    {/if}
    {#each options as opt (opt.value)}
      <option value={opt.value} class="bg-slate-900 text-white">{opt.label}</option>
    {/each}
  </select>
  <ChevronDown
    size={16}
    class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
  />
</div>
