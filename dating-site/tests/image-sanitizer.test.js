import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { sanitizeImage } from '../render/image.js';

test('a photographed image is decoded, resized and stripped of EXIF metadata', async () => {
  const original = await sharp({
    create: { width: 1800, height: 1000, channels: 3, background: '#336699' }
  }).jpeg().withExif({ IFD0: { Copyright: 'PRIVATE_SOURCE_METADATA' } }).toBuffer();
  const originalMetadata = await sharp(original).metadata();
  assert.ok(originalMetadata.exif, 'fixture includes real EXIF metadata');
  const clean = await sanitizeImage(original, 'image/jpeg');
  const info = await sharp(clean).metadata();
  assert.equal(info.format, 'webp');
  assert.equal(info.width, 1600);
  assert.equal(info.exif, undefined);
  assert.equal(info.xmp, undefined);
  assert.ok(clean.length < 4 * 1024 * 1024);
});

test('the sanitizer rejects corrupted file content and mismatched MIME types', async () => {
  const png = await sharp({ create: { width: 12, height: 12, channels: 3, background: 'green' } }).png().toBuffer();
  await assert.rejects(() => sanitizeImage(png, 'image/jpeg'), /изображение/i);
  await assert.rejects(() => sanitizeImage(Buffer.from('<html>not an image</html>'), 'image/jpeg'), /изображение/i);
  const result = await sanitizeImage(png, 'image/png');
  assert.equal((await sharp(result).metadata()).format, 'webp');
});

test('the sanitizer rejects abusive file sizes and oversized dimensions', async () => {
  await assert.rejects(() => sanitizeImage(Buffer.alloc(4 * 1024 * 1024 + 1), 'image/jpeg'), /4 МБ/);
  const large = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: 'white' }
  }).png().toBuffer();
  await assert.rejects(() => sanitizeImage(large, 'image/png'), /изображение/i);
});
