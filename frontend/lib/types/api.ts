import { User } from './user'

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface ApiResponse<T = any> {
  data: T
  message?: string
}
