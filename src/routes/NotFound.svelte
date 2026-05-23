<script>
  import Button from '$lib/components/ui/Button.svelte';
</script>

<section class="mx-auto flex max-w-md flex-col items-center gap-6 py-24 text-center">
  <p class="text-7xl font-semibold tracking-tight text-slate-700">404</p>
  <div class="flex flex-col gap-2">
    <h1 class="text-xl font-medium text-white">Page not found</h1>
    <p class="text-sm text-slate-500">That URL doesn't match anything we know how to render.</p>
  </div>
  <Button href="#/" size="sm">Back home</Button>
</section>
