export interface User {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  avatarUrl?: string
  role?: string
  isVerifiedEmail?: boolean
  isVerifiedPhone?: boolean
  authProvider?: string
  telegramId?: string
}
