# Sublume AI Studio

Video and audio transcription in the browser using open-source Whisper through Transformers.js and FFmpeg.wasm.

- Frontend: React + Vite + Tailwind
- Speech-to-text: Whisper Tiny on local browser CPU (WASM), model downloaded on first use
- Output: editable captions, SRT/VTT/TXT, SRT/VTT import, selectable MP4 caption track (not burned in)
- Files remain on the user's device; no media upload to this website
- No subscriptions or paid API access configured yet

## Development

```bash
npm install
npm run dev
npm run build
```

This subproject is deployed to Render Static Site `cenaradar` via the `price-aggregator-mvp` branch of `virus53111/dogizen`. Build command: `cd price-aggregator && npm install && npm run build`. Publish path: `price-aggregator/dist`.

The former CenaRadar content was preserved in the backup branch `backup/cenaradar-before-sublume-2026-10-29`.

- Recognition: searchable full Whisper language list, Tiny and Base model selections.

- Translation mode uses the open Whisper model to translate speech into English only; other target languages are not yet supported.
