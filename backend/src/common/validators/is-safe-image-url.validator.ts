import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

function isForbiddenDataImage(value: string): boolean {
  return value.trim().toLowerCase().startsWith('data:image')
}

function isAllowedUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (v.startsWith('/uploads/')) return true
  if (v.startsWith('http://') || v.startsWith('https://')) return true
  return false
}

/**
 * URL-only contract for images.
 * - Forbids data:image (base64)
 * - Allows http(s) absolute URLs or /uploads/... relative paths
 */
export function IsSafeImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeImageUrl',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false
          if (isForbiddenDataImage(value)) return false
          return isAllowedUrl(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} должен быть URL (http/https) или /uploads/...; data:image запрещён`
        },
      },
    })
  }
}

