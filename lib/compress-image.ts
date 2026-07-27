const MAX_DIMENSION = 2000
const JPEG_QUALITY = 0.85

/**
 * Downscale + re-encode an image File to JPEG in the browser, BEFORE upload.
 *
 * Fixes the two ways a phone photo fails to upload:
 *  - iPhone HEIC/HEIF: the canvas re-encode outputs JPEG, so the server — and
 *    every browser that later renders the published site — gets a format it can
 *    read. This relies on the browser being able to DECODE the source; iOS
 *    Safari can decode HEIC, and that is exactly the device that produces it.
 *  - Oversized shots: 8–12 MB camera photos are scaled to <=2000px and
 *    re-encoded, landing well under the server's size limit.
 *
 * Best-effort and non-destructive: if anything fails (an engine that cannot
 * decode the source, a decode error) the ORIGINAL file is returned unchanged so
 * ordinary jpg/png uploads never regress. Animated/vector formats are left
 * alone — flattening a GIF or SVG to one JPEG frame is worse than the bytes it
 * would save.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  const looksLikeImage =
    file.type.startsWith('image/') || /\.(hei[cf]|jpe?g|png|webp|avif)$/i.test(file.name)
  if (!looksLikeImage) return file

  try {
    const source = await loadDecodable(file)
    const srcW = 'width' in source ? source.width : (source as HTMLImageElement).naturalWidth
    const srcH = 'height' in source ? source.height : (source as HTMLImageElement).naturalHeight
    if (!srcW || !srcH) return file

    const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH))
    const w = Math.round(srcW * scale)
    const h = Math.round(srcH * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h)
    if ('close' in source) (source as ImageBitmap).close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob) return file

    // Keep the original when it is already a smaller JPEG — re-encoding a small,
    // well-compressed photo can grow it.
    if (blob.size >= file.size && file.type === 'image/jpeg') return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

/**
 * createImageBitmap is fastest and decodes off the main thread, but not every
 * engine decodes HEIC through it. Fall back to an <img> element, which iOS
 * Safari CAN decode for HEIC.
 */
async function loadDecodable(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file)
  } catch {
    return await loadViaImg(file)
  }
}

function loadViaImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image decode failed'))
    }
    img.src = url
  })
}
