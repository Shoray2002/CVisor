<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import { loadFaceModel, loadLandmarkNet, loadRecognitionNet } from '$lib/models.js';
  import { detectFacesWithDescriptors, cropFaceToBlob } from '$lib/recognition.js';
  import { listRoster, addToRoster, deleteFromRoster } from '$lib/storage.js';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ImageUp from '@lucide/svelte/icons/image-up';
  import X from '@lucide/svelte/icons/x';

  let roster = $state([]);
  let loading = $state(false);
  let bulkPending = $state([]); // [{ descriptor, thumbnail, name }]
  let error = $state('');

  async function refresh() {
    roster = await listRoster();
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    error = '';
    loading = true;
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = objectUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Couldn't read that image."));
      });

      const faceapi = await loadFaceModel();
      await loadLandmarkNet();
      await loadRecognitionNet();

      const results = await detectFacesWithDescriptors(faceapi, img, 0.4);
      if (!results.length) {
        error = 'No faces detected in that photo.';
        return;
      }

      const pending = [];
      for (const r of results) {
        const thumbnail = await cropFaceToBlob(img, r.detection.box);
        pending.push({ descriptor: r.descriptor, thumbnail, name: '' });
      }
      bulkPending = pending;
    } catch (err) {
      error = err?.message ?? 'Failed to read photo.';
    } finally {
      URL.revokeObjectURL(objectUrl);
      loading = false;
    }
  }

  async function saveBulk() {
    const toSave = bulkPending.filter((p) => p.name.trim());
    if (!toSave.length) {
      error = 'Name at least one of the detected faces before saving.';
      return;
    }
    error = '';
    for (const p of toSave) {
      await addToRoster({
        name: p.name.trim(),
        embedding: p.descriptor,
        thumbnail: p.thumbnail,
      });
    }
    bulkPending = [];
    await refresh();
  }

  function discardBulkItem(i) {
    bulkPending = bulkPending.filter((_, idx) => idx !== i);
  }

  function cancelBulk() {
    bulkPending = [];
    error = '';
  }

  async function remove(id) {
    await deleteFromRoster(id);
    await refresh();
  }

  function thumbUrl(blob) {
    return blob ? URL.createObjectURL(blob) : null;
  }

  onMount(refresh);
</script>

<Loader show={loading} label="Scanning photo for faces…" />

<section class="flex flex-col gap-10">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Roster</h1>
    <p class="max-w-xl text-sm text-slate-400">
      Enrolled faces. Stored in your browser only — embeddings never leave this device.
    </p>
  </header>

  <div class="flex flex-col gap-6">
    {#if bulkPending.length === 0}
      <div>
        <label
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
        >
          <ImageUp size={14} />
          Upload photo
          <input type="file" accept="image/*" class="hidden" onchange={handlePhotoUpload} />
        </label>
      </div>
    {/if}

    {#if bulkPending.length > 0}
      <div class="glass flex flex-col gap-5 rounded-2xl p-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-white">
              {bulkPending.length}
              {bulkPending.length === 1 ? 'face' : 'faces'} found
            </h2>
            <p class="text-xs text-slate-500">
              Give each one a name to enroll it. Unnamed faces are skipped.
            </p>
          </div>
          <div class="flex gap-2">
            <Button size="sm" onclick={saveBulk}>Save all</Button>
            <Button size="sm" variant="ghost" onclick={cancelBulk}>Cancel</Button>
          </div>
        </div>

        <ul class="grid gap-3 sm:grid-cols-2">
          {#each bulkPending as pending, i (i)}
            {@const url = thumbUrl(pending.thumbnail)}
            <li
              class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
            >
              <img
                src={url}
                alt={`detected face ${i + 1}`}
                class="size-14 shrink-0 rounded-md object-cover"
                onload={() => URL.revokeObjectURL(url)}
              />
              <input
                type="text"
                bind:value={bulkPending[i].name}
                placeholder="Name"
                class="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
              <button
                type="button"
                onclick={() => discardBulkItem(i)}
                class="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                aria-label="Discard"
              >
                <X size={16} />
              </button>
            </li>
          {/each}
        </ul>

        {#if error}
          <p class="text-sm text-rose-300">{error}</p>
        {/if}
      </div>
    {/if}

    {#if bulkPending.length === 0 && error}
      <p class="text-sm text-rose-300">{error}</p>
    {/if}

    {#if roster.length === 0}
      <p
        class="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500"
      >
        No enrolled faces yet. Upload a photo containing the faces you want Live to recognize.
      </p>
    {:else}
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each roster as entry (entry.id)}
          {@const url = thumbUrl(entry.thumbnail)}
          <li class="glass flex items-center gap-3 rounded-xl p-3">
            <img
              src={url}
              alt={entry.name}
              class="size-14 shrink-0 rounded-md object-cover"
              onload={() => URL.revokeObjectURL(url)}
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">{entry.name}</p>
              <p class="truncate text-xs text-slate-500">
                Added {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onclick={() => remove(entry.id)}
              class="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>
