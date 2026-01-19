/**
 * ЕДИНАЯ ФУНКЦИЯ САНИТИЗАЦИИ images[].
 * КРИТИЧНО: использовать при получении данных с API, перед сохранением в state, перед рендером.
 * 
 * Гарантирует:
 * - Всегда возвращает string[]
 * - Никогда не возвращает null/undefined
 * - Фильтрует data:image
 * - Фильтрует не-URL строки
 * - Фильтрует пустые строки
 */
export function sanitizeImages(input: unknown): string[] {
  // Если не массив - возвращаем пустой массив
  if (!Array.isArray(input)) {
    return []
  }

  // Фильтруем и валидируем каждый элемент
  return input
    .filter((img): img is string => {
      // Только строки
      if (typeof img !== 'string') return false
      
      const trimmed = img.trim()
      
      // Пустые строки не допускаются
      if (!trimmed) return false
      
      // Строго запрещаем data:image (base64)
      if (trimmed.toLowerCase().startsWith('data:image')) return false
      
      // Разрешаем только http(s):// URL
      return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    })
    .map((img) => img.trim())
}

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
  if (trimmed.toLowerCase().startsWith('data:image')) {
    return '/placeholder-image.svg'
  }

  // Разрешены только http(s):// URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '/placeholder-image.svg'
  }

  return trimmed
}

/**
 * @deprecated Используйте sanitizeImages() вместо этой функции
 * Фильтрует массив images[], удаляя все невалидные src (data:image, пустые строки).
 * Возвращает только валидные http(s):// URL.
 */
export function filterValidImageUrls(images: unknown[]): string[] {
  return sanitizeImages(images)
}
