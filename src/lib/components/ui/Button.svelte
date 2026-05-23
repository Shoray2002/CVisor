<script>
  import { cn } from '$lib/utils.js';

  let {
    variant = 'default',
    size = 'default',
    href = null,
    type = 'button',
    disabled = false,
    class: className = '',
    children,
    ...rest
  } = $props();

  const variants = {
    default: 'bg-white text-slate-950 hover:bg-slate-200',
    secondary: 'bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.1]',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
    default: 'h-10 px-4 text-sm rounded-lg gap-2',
    lg: 'h-11 px-5 text-sm rounded-lg gap-2',
    icon: 'h-9 w-9 rounded-lg',
  };

  const base =
    'inline-flex items-center justify-center font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ' +
    'disabled:pointer-events-none disabled:opacity-50';
</script>

{#if href}
  <a {href} class={cn(base, variants[variant], sizes[size], className)} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={cn(base, variants[variant], sizes[size], className)} {...rest}>
    {@render children?.()}
  </button>
{/if}
