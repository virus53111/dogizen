import sharp from 'sharp';

const formats = new Map([
  ['jpeg','image/jpeg'],
  ['png','image/png'],
  ['webp','image/webp']
]);
const INPUT_LIMIT = 4 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;
const MAX_EDGE = 1600;

/** Decode uploaded raster images and remove EXIF/GPS/ICC/XMP by re-encoding.
 * No SVG/GIF/TIFF/HEIC, animation, or images exceeding the pixel limit.
 */
export async function sanitizeImage(buffer, declaredMime) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > INPUT_LIMIT)
    throw new Error('Фотография должна быть JPG, PNG или WebP размером до 4 МБ');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(declaredMime))
    throw new Error('Формат фотографии не поддерживается');
  try {
    const reader = sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: 'error' });
    const info = await reader.metadata();
    if (formats.get(info.format) !== declaredMime ||
        !Number.isInteger(info.width) || !Number.isInteger(info.height) ||
        !info.width || !info.height ||
        info.width * info.height > MAX_PIXELS || (info.pages || 1) !== 1)
      throw new Error('Неверный формат или слишком большое изображение');
    // sharp's default output has NO EXIF, GPS, XMP or other embedded metadata.
    const result = await sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: 'error' })
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    if (!result.length || result.length > INPUT_LIMIT)
      throw new Error('Не удалось безопасно сжать фотографию');
    return result;
  } catch {
    // Never include native codec messages in public HTTP responses.
    throw new Error('Повреждённое или неподдерживаемое изображение. Загрузите другое фото.');
  }
}
