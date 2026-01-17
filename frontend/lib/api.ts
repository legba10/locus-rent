import axios, { AxiosResponse } from 'axios'
import { LoginPayload, RegisterPayload } from './types/auth'
import { AuthResponse } from './types/api'
import { User } from './types/user'
import { Listing } from './types/listing'
import { SmartSearchResults } from './types/recommendation'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок подключения к серверу
    if (!error.response && error.request) {
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.message?.includes('Network Error') ||
                            error.message?.includes('ERR_CONNECTION_REFUSED')
      
      if (isNetworkError) {
        const currentApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://locus-rent.onrender.com';
        error.response = {
          data: {
            message: `Сервер не отвечает. Проверьте подключение к интернету и убедитесь, что backend запущен. (API: ${currentApiUrl})`,
            error: 'Connection Error',
          },
          status: 0,
        }
      }
    }
    
    // Обработка 401 - неавторизован
    if (error.response?.status === 401) {
      // Не перенаправляем на /login если мы уже на странице логина/регистрации
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }
    
    // Улучшенная обработка сетевых ошибок
    if (!error.response) {
      // Нет ответа от сервера - вероятно, backend не запущен
      if (error.code === 'ECONNREFUSED' || 
          error.message?.includes('Network Error') ||
          error.message?.includes('fetch failed') ||
          error.code === 'ERR_NETWORK') {
        error.userMessage = 'Сервер не отвечает. Проверьте подключение к интернету и убедитесь, что backend запущен.'
        // Добавляем более подробную информацию для разработки
        if (process.env.NODE_ENV === 'development') {
          console.error('Backend connection error. Is backend running?')
          console.error('Expected backend URL:', API_URL)
        }
      } else {
        error.userMessage = 'Ошибка сети. Проверьте подключение к интернету.'
      }
    } else {
      // Есть ответ от сервера, но это ошибка
      error.userMessage = error.response.data?.message || 
                         error.response.data?.error ||
                         `Ошибка сервера: ${error.response.status}`
    }
    
    return Promise.reject(error)
  }
)

export default api

// API методы
export const authAPI = {
  register: (data: RegisterPayload): Promise<AxiosResponse<AuthResponse>> => 
    api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginPayload): Promise<AxiosResponse<AuthResponse>> => 
    api.post<AuthResponse>('/auth/login', data),
  loginWithTelegram: (data: { id: string; firstName?: string; lastName?: string; username?: string; photoUrl?: string; authDate: number; hash: string }): Promise<AxiosResponse<AuthResponse>> => 
    api.post<AuthResponse>('/auth/telegram', data),
  sendCode: (type: 'email' | 'phone', identifier: string) => 
    api.post('/auth/send-code', { type, identifier }),
  verifyCode: (identifier: string, code: string, type: 'email' | 'phone') =>
    api.post('/auth/verify-code', { identifier, code, type }),
  verifyContact: (identifier: string, code: string, type: 'email' | 'phone') =>
    api.post('/auth/verify-contact', { identifier, code, type }),
}

export const listingsAPI = {
  getAll: (params?: Record<string, any>): Promise<AxiosResponse<{ data: Listing[] }>> => 
    api.get<{ data: Listing[] }>('/listings', { params }),
  getOne: (id: string): Promise<AxiosResponse<{ data: Listing }>> => 
    api.get<{ data: Listing }>(`/listings/${id}`),
  create: (data: Partial<Listing>): Promise<AxiosResponse<{ data: Listing }>> => 
    api.post<{ data: Listing }>('/listings', data),
  update: (id: string, data: Partial<Listing>): Promise<AxiosResponse<{ data: Listing }>> => 
    api.patch<{ data: Listing }>(`/listings/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> => 
    api.delete<void>(`/listings/${id}`),
  duplicate: (id: string): Promise<AxiosResponse<{ data: Listing }>> => 
    api.post<{ data: Listing }>(`/listings/${id}/duplicate`),
  getMy: (): Promise<AxiosResponse<{ data: Listing[] }>> => 
    api.get<{ data: Listing[] }>('/listings/my'),
}

export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  update: (id: string, data: any) => api.patch(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
}

export const reviewsAPI = {
  getAll: () => api.get('/reviews'),
  getByListing: (listingId: string) => api.get(`/reviews/listing/${listingId}`),
  create: (data: any) => api.post('/reviews', data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
}

export const usersAPI = {
  getMe: (): Promise<AxiosResponse<User>> => 
    api.get<User>('/users/me'),
  update: (id: string, data: Partial<User>): Promise<AxiosResponse<User>> => 
    api.patch<User>(`/users/${id}`, data),
}

export const recommendationAPI = {
  smartSearch: (data: Record<string, any>): Promise<AxiosResponse<{ data: SmartSearchResults }>> => 
    api.post<{ data: SmartSearchResults }>('/recommendation/smart-search', data),
  getRecommendations: (params?: Record<string, any>): Promise<AxiosResponse<{ data: Listing[] }>> => 
    api.get<{ data: Listing[] }>('/recommendation/listings', { params }),
  getSearchHistory: (): Promise<AxiosResponse<{ data: any[] }>> => 
    api.get<{ data: any[] }>('/recommendation/search-history'),
  getPreferences: (): Promise<AxiosResponse<{ data: any }>> => 
    api.get<{ data: any }>('/recommendation/preferences'),
  savePreferences: (preferences: Record<string, any>): Promise<AxiosResponse<{ data: any }>> => 
    api.post<{ data: any }>('/recommendation/preferences', { preferences }),
  markFeedback: (id: string, feedback: 'liked' | 'disliked'): Promise<AxiosResponse<void>> =>
    api.post<void>(`/recommendation/recommendations/${id}/feedback`, { feedback }),
}

export const citiesAPI = {
  search: (query: string, limit?: number) => api.get('/cities/search', { params: { q: query, limit } }),
  getByCoordinates: (lat: number, lng: number) => api.get('/cities/by-coordinates', { params: { lat, lng } }),
  updateLocation: (lat: number, lng: number) => api.post('/cities/update-location', null, { params: { lat, lng } }),
}
