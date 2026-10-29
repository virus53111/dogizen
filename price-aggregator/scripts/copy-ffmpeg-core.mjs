import { mkdir, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const source = resolve('node_modules/@ffmpeg/core/dist/esm');
const target = resolve('public/ffmpeg');
await mkdir(target, { recursive: true });
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  await copyFile(join(source, name), join(target, name));
  console.log('Bundled local FFmpeg:', name);
}
