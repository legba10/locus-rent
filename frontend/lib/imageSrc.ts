export type ImageSrcValidationResult =
  | { ok: true; src: string }
  | { ok: false; reason: string; original: string }

/**
 * Validates and normalizes image src.
 * ARCH REQUIREMENT: запрещаем data:image в продакшене.
 * Разрешаем только http(s), относительные пути, blob: (для локальных preview).
 */
export function validateImageSrc(input: unknown): ImageSrcValidationResult {
  const original = typeof input === 'string' ? input : ''
  const src = original.trim()

  if (!src) return { ok: false, reason: 'empty', original }

  // Запрещаем data:image категорически (исключаем ERR_INVALID_URL на обрезанных base64)
  if (src.startsWith('data:image')) {
    return { ok: false, reason: 'data-image-forbidden', original }
  }

  // Разрешённые типы URL
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('/') ||
    src.startsWith('blob:')
  ) {
    return { ok: true, src }
  }

  return { ok: false, reason: 'unsupported-src', original }
}

