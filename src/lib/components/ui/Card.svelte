<script>
  import { cn } from '$lib/utils.js';
  let { class: className = '', children, ...rest } = $props();
</script>

<div class={cn('glass rounded-2xl p-6', className)} {...rest}>
  {@render children?.()}
</div>
