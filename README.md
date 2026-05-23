# Watchroom

On-device CCTV monitor. Detects faces in a video feed, recognizes enrolled
identities, and flags strangers and loitering — all in the browser, with no
data leaving the device. Installable as a PWA, works offline after first load.

## How to use

The whole flow is two steps: build a watchlist, then point it at a feed.

### 1. Enroll the faces you want recognized

Open `/#/roster`.

- Click **Upload photo** and pick any image containing the faces you want on
  the watchlist. Group photos work — every face the model detects shows up
  as a row.
- Type a name for each face. Leave a row blank (or hit the **×**) to skip it.
- **Save all** writes the named entries to the browser's IndexedDB.
  Embeddings are 128-d floats — they live on this device only.

Tips for accuracy: pick photos with clearly-lit, mostly-frontal faces; one
person per row means one embedding per roster entry. You can enroll the same
person from multiple photos to capture different angles — Live's matcher
picks the best of all enrolled entries.

### 2. Watch a feed

Open `/#/live`.

Pick a source:

- **Webcam** — pick the camera from the dropdown. The list populates after
  you grant camera permission.
- **Remote feed** — paste an HLS (`.m3u8`) URL and **Connect**. The stream
  has to serve CORS headers; if it doesn't, the box overlay won't draw and
  you'll see a CORS message. There's a **Try sample** button that fills in
  a known-working test stream.

Set the **Dwell threshold** (seconds). When a face stays in frame past this,
the box turns amber and a `Loitering` event is logged.

Hit **Start**. Models load on the first run and stay cached. Each detected
face gets a box:

| Color  | Meaning                                                |
| ------ | ------------------------------------------------------ |
| Indigo | New track — still aggregating frames before committing |
| Green  | Roster match (label = the name you entered)            |
| Rose   | Stranger — no roster match across the smoothing window |
| Amber  | Loitering — dwell time exceeded the threshold          |

The right-hand **Event log** records `Unknown face` (first time a stranger
is confirmed for a track) and `Loitering` events with a face thumbnail and
a relative timestamp. Events persist across reloads. **Clear** wipes them.

### 3. (Optional) Review a recording

`/#/review` runs the same pipeline against an uploaded video file. Useful
for after-the-fact CCTV review against your existing roster.

### Install as a PWA

The browser will offer an install prompt once it sees the manifest. Once
installed, Watchroom launches in its own window, works offline (models are
service-worker cached after the first load), and survives reloads with the
roster + event log intact.

## Stack

- Svelte 5 + Vite 6 + Tailwind v4
- `@vladmandic/face-api` (detection + landmarks + 128-d embeddings)
- `hls.js` for remote HLS feeds (Safari uses native HLS)
- `vite-plugin-pwa` (Workbox) — manifest + service worker, models precached
- IndexedDB for the roster + event log

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the production build
```

Lint + format: `npm run lint`, `npm run format`.

## Routes

| Path      | Purpose                                                           |
| --------- | ----------------------------------------------------------------- |
| `/`       | Landing                                                           |
| `/live`   | Live feed: webcam or remote HLS, with watchlist + dwell overlays  |
| `/review` | Same pipeline against an uploaded recording                       |
| `/roster` | Upload a photo — every detected face becomes a named roster entry |

Routing is hash-based (`/#/live`, `/#/roster`, …) so no server-side rewrites
are needed when deploying.

## Where things live

```
src/
├─ main.js                 entry, mounts <App/>
├─ app.css                 Tailwind import + design tokens
├─ App.svelte              router shell + nav
├─ lib/
│  ├─ models.js            face / landmark / recognition net loaders
│  ├─ recognition.js       face-api detection helpers + embedding match
│  ├─ analyze.js           per-frame loop: tracker, dwell, overlay paint
│  ├─ sources.js           webcam / HLS source factories
│  ├─ storage.js           IndexedDB for roster + events
│  ├─ utils.js             cn() helper (clsx + tailwind-merge)
│  └─ components/          DetectionCanvas, EventLog, Loader, SourcePicker,
│                          StatusBadge, ui/{Button,Select}
└─ routes/
   ├─ Home.svelte
   ├─ Live.svelte
   ├─ Review.svelte
   ├─ Roster.svelte
   └─ NotFound.svelte
```

Models live in `public/models/{face,landmark,recognition}/` and are
runtime-cached by the service worker on first load.

## Remote feeds

HLS only (`.m3u8`). The stream must serve CORS headers — without them the
browser blocks pixel reads off the video and analysis can't run. Most NVRs
expose a CORS toggle in their web UI. Native RTSP is intentionally
unsupported; piping through a server proxy would defeat the on-device
guarantee.

## License

MIT — see `LICENSE.txt`.
