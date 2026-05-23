<script>
  import Router, { link, location } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import Home from './routes/Home.svelte';
  import NotFound from './routes/NotFound.svelte';

  const routes = {
    '/': Home,
    '/video': wrap({ asyncComponent: () => import('./routes/Video.svelte') }),
    '/stream': wrap({ asyncComponent: () => import('./routes/Stream.svelte') }),
    '*': NotFound,
  };

  const nav = [
    { path: '/', label: 'Home' },
    { path: '/video', label: 'Video' },
    { path: '/stream', label: 'Stream' },
  ];
</script>

<div class="flex min-h-screen flex-col">
  <header class="px-4 pt-6 sm:px-8">
    <nav class="mx-auto flex max-w-5xl items-center justify-between" aria-label="Primary">
      <a use:link href="/" class="flex items-center gap-2.5">
        <span
          class="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-bold tracking-tight text-white"
        >
          CV
        </span>
        <span class="text-sm font-semibold tracking-tight text-white">CVisor</span>
      </a>

      <ul class="flex items-center gap-1 text-sm">
        {#each nav as item (item.path)}
          {@const active =
            $location === item.path || (item.path !== '/' && $location.startsWith(item.path))}
          <li>
            <a
              use:link
              href={item.path}
              class={[
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                active ? 'text-white' : 'text-slate-400 hover:text-white',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </header>

  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8 sm:py-16">
    <Router {routes} />
  </main>

  <footer class="px-4 pb-6 pt-2 text-center text-xs text-slate-600 sm:px-8">
    <a
      href="https://github.com/Shoray2002/CVisor"
      target="_blank"
      rel="noreferrer"
      class="transition-colors hover:text-slate-300"
    >
      View source
    </a>
  </footer>
</div>
