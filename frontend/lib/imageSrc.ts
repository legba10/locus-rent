export type ImageSrcValidationResult =
  | { ok: true; src: string }
  | { ok: false; reason: string; original: string }

const MIN_DATA_IMAGE_LEN = 50

/**
 * Validates and normalizes image src.
 * - Rejects "data:image/*;base64" without payload (prevents ERR_INVALID_URL)
 * - Requires base64 payload length > 50 chars
 * - Accepts http(s), / (relative), blob:, and valid data:image/*;base64,...
 */
export function validateImageSrc(input: unknown): ImageSrcValidationResult {
  const original = typeof input === 'string' ? input : ''
  const src = original.trim()

  if (!src) return { ok: false, reason: 'empty', original }

  // data:image/*;base64,...
  if (src.startsWith('data:image')) {
    const base64Marker = 'base64,'
    const markerIndex = src.indexOf(base64Marker)
    if (markerIndex === -1) {
      return { ok: false, reason: 'data-image-without-base64-marker', original }
    }
    const payload = src.slice(markerIndex + base64Marker.length)
    if (!payload || payload.trim().length <= MIN_DATA_IMAGE_LEN) {
      return { ok: false, reason: 'data-image-base64-payload-too-short', original }
    }
    return { ok: true, src }
  }

  // common valid URL types
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/') ||
    src.startsWith('blob:')
  ) {
    return { ok: true, src }
  }

  // otherwise reject (prevents feeding invalid strings into <img src>)
  return { ok: false, reason: 'unsupported-src', original }
}

