<script>
  import { link } from 'svelte-spa-router';
  import FileVideo from '@lucide/svelte/icons/file-video';
  import Radio from '@lucide/svelte/icons/radio';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<section class="flex flex-col gap-16">
  <div class="flex flex-col gap-6 pt-4 sm:pt-12">
    <p class="text-sm tracking-wide text-indigo-300/80 uppercase">
      Computer vision · in the browser
    </p>
    <h1 class="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
      Detect faces and masks in real time,
      <span class="text-slate-400">on-device.</span>
    </h1>
    <p class="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
      CVisor runs face detection and mask classification entirely in your browser. Frames never
      leave your device, and the app works offline once installed.
    </p>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <a
      use:link
      href="/stream"
      class="group glass flex items-center justify-between rounded-2xl p-6 transition-colors hover:bg-white/[0.08]"
    >
      <div class="flex items-center gap-4">
        <span class="grid size-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
          <Radio size={20} />
        </span>
        <span class="flex flex-col">
          <span class="font-medium text-white">Live camera</span>
          <span class="text-sm text-slate-400">Use your webcam</span>
        </span>
      </div>
      <ArrowRight
        size={18}
        class="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
      />
    </a>

    <a
      use:link
      href="/video"
      class="group glass flex items-center justify-between rounded-2xl p-6 transition-colors hover:bg-white/[0.08]"
    >
      <div class="flex items-center gap-4">
        <span class="grid size-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <FileVideo size={20} />
        </span>
        <span class="flex flex-col">
          <span class="font-medium text-white">Upload a video</span>
          <span class="text-sm text-slate-400">Analyze a recording</span>
        </span>
      </div>
      <ArrowRight
        size={18}
        class="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
      />
    </a>
  </div>
</section>
