/**
 * Универсальная функция нормализации image src.
 * Единственный допустимый формат: http(s):// URL или Supabase public URL.
 * data:image полностью запрещён.
 */
export function normalizeImageSrc(src?: string | null): string {
  if (!src || typeof src !== 'string') {
    return '/placeholder-image.svg'
  }

  const trimmed = src.trim()

  // Строго запрещаем data:image (base64)
  if (trimmed.startsWith('data:image')) {
    return '/placeholder-image.svg'
  }

  // Разрешены только http(s):// URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '/placeholder-image.svg'
  }

  return trimmed
}

/**
 * Фильтрует массив images[], удаляя все невалидные src (data:image, пустые строки).
 * Возвращает только валидные http(s):// URL.
 */
export function filterValidImageUrls(images: unknown[]): string[] {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .filter((img): img is string => {
      if (typeof img !== 'string') return false
      const trimmed = img.trim()
      if (!trimmed) return false
      // Запрещаем data:image
      if (trimmed.startsWith('data:image')) return false
      // Разрешаем только http(s)://
      return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    })
    .map((img) => img.trim())
}
