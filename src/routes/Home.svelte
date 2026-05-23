<script>
  import { link } from 'svelte-spa-router';
  import Radio from '@lucide/svelte/icons/radio';
  import Users from '@lucide/svelte/icons/users';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<section class="flex flex-col gap-16">
  <div class="flex flex-col gap-6 pt-4 sm:pt-12">
    <p class="text-sm tracking-wide text-indigo-300/80 uppercase">On-device CCTV monitoring</p>
    <h1 class="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
      Watch your space,
      <span class="text-slate-400">stay private.</span>
    </h1>
    <p class="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
      Watchroom runs face detection and recognition directly in your browser. Enroll faces you know,
      point it at a webcam, HLS stream, or recording, and get alerts for strangers and loitering —
      without anything leaving the device.
    </p>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <a
      use:link
      href="/live"
      class="group glass flex items-center justify-between rounded-2xl p-6 transition-colors hover:bg-white/[0.08]"
    >
      <div class="flex items-center gap-4">
        <span class="grid size-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
          <Radio size={20} />
        </span>
        <span class="flex flex-col">
          <span class="font-medium text-white">Live monitoring</span>
          <span class="text-sm text-slate-400">Webcam, HLS, or demo feed</span>
        </span>
      </div>
      <ArrowRight
        size={18}
        class="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
      />
    </a>

    <a
      use:link
      href="/roster"
      class="group glass flex items-center justify-between rounded-2xl p-6 transition-colors hover:bg-white/[0.08]"
    >
      <div class="flex items-center gap-4">
        <span class="grid size-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <Users size={20} />
        </span>
        <span class="flex flex-col">
          <span class="font-medium text-white">Manage roster</span>
          <span class="text-sm text-slate-400">Enroll known faces</span>
        </span>
      </div>
      <ArrowRight
        size={18}
        class="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
      />
    </a>
  </div>
</section>
