// Image fetching + downscaling, runs inside the service worker.
// Uses createImageBitmap + OffscreenCanvas (both available in MV3 workers).

function abToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function blobToDataURL(blob) {
  const buf = await blob.arrayBuffer();
  const type = blob.type || 'image/jpeg';
  return `data:${type};base64,${abToBase64(buf)}`;
}

async function drawToDataURL(bitmap, targetDim, type, quality) {
  const { width, height } = bitmap;
  const scale = Math.min(1, targetDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type, quality });
  return blobToDataURL(blob);
}

/**
 * Fetches an image (or accepts a data: URL) and returns:
 *  - dataUrl: downscaled JPEG data URL to send to the model
 *  - thumb:   tiny JPEG data URL for history / batch tiles
 *  - width/height: original dimensions
 */
export async function prepareImage(srcUrl, { maxDim = 1024, jpegQuality = 0.9 } = {}) {
  let blob;
  if (srcUrl.startsWith('data:')) {
    blob = await (await fetch(srcUrl)).blob();
  } else {
    let res = await fetch(srcUrl, { credentials: 'omit' });
    // Image may be cookie/auth-gated; retry carrying credentials before giving up.
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      res = await fetch(srcUrl, { credentials: 'include' }).catch(() => res);
    }
    if (!res.ok) throw new Error(`无法读取图片（HTTP ${res.status}）`);
    blob = await res.blob();
  }

  // SVG (and other non-rasterizable types) can't be decoded by createImageBitmap in a worker.
  if (blob.type === 'image/svg+xml') {
    throw new Error('暂不支持 SVG 矢量图，请改用位图（JPG / PNG / WebP）');
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (e) {
    throw new Error('图片解码失败，可能是受保护或不支持的格式');
  }

  const width = bitmap.width;
  const height = bitmap.height;
  const dataUrl = await drawToDataURL(bitmap, maxDim, 'image/jpeg', jpegQuality);
  const thumb = await drawToDataURL(bitmap, 128, 'image/jpeg', 0.7);
  bitmap.close?.();
  return { dataUrl, thumb, width, height };
}
