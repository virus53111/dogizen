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

## Android audio extraction fix
- FFmpeg ESM core (32 MB WASM) is served from the same domain; no external CDN required.
- Try native AudioContext decoding before FFmpeg; both paths produce mono 16kHz PCM for Whisper.
- The FFmpeg core is GPL-2.0-or-later: retain appropriate license notice and make corresponding sources available when distributing.
- Mobile inference still requires device-level tests and sufficient memory.

### In-frame subtitle export
New Canvas + MediaRecorder export paints captions permanently on video frames. MP4 is offered only if the browser supports H.264/AAC; otherwise WebM is downloaded. Uses WebAudio to retain source audio. Mobile clips are limited to 90s; keep the recording tab active. The completed video can be previewed before download. Do not misrepresent as a soft MP4 subtitle track. Video codec support and audio require real-device QA.

## Local video demo
The button «Проверить без своего видео» builds a 4-second synthetic video locally using Canvas+MediaRecorder and provides 2 obviously demo captions to test preview and burned-in export without running Whisper.

## Real speech QA fixture
The optional «Проверить Whisper на настоящей речи» downloads a short English WAV used by the official Transformers.js documentation from Hugging Face, selects English+Tiny, and lets the user click the ordinary Create Subtitles button. Unlike the synthetic video demo, this tests model download, actual audio decoding, inference, timestamps, and editor output. It requires network access to fetch the sample and the model.
