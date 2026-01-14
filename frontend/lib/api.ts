import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
        error.userMessage = 'Сервер не отвечает. Проверьте, что backend запущен на порту 3001.'
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
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  loginWithTelegram: (data: any) => api.post('/auth/telegram', data),
  sendCode: (type: 'email' | 'phone', identifier: string) => 
    api.post('/auth/send-code', { type, identifier }),
  verifyCode: (identifier: string, code: string, type: 'email' | 'phone') =>
    api.post('/auth/verify-code', { identifier, code, type }),
  verifyContact: (identifier: string, code: string, type: 'email' | 'phone') =>
    api.post('/auth/verify-contact', { identifier, code, type }),
}

export const listingsAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getOne: (id: string) => api.get(`/listings/${id}`),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.patch(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  duplicate: (id: string) => api.post(`/listings/${id}/duplicate`),
  getMy: () => api.get('/listings/my'),
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
  getMe: () => api.get('/users/me'),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
}

export const recommendationAPI = {
  smartSearch: (data: any) => api.post('/recommendation/smart-search', data),
  getRecommendations: (params?: any) => api.get('/recommendation/listings', { params }),
  getSearchHistory: () => api.get('/recommendation/search-history'),
  getPreferences: () => api.get('/recommendation/preferences'),
  savePreferences: (preferences: any) => api.post('/recommendation/preferences', { preferences }),
  markFeedback: (id: string, feedback: 'liked' | 'disliked') =>
    api.post(`/recommendation/recommendations/${id}/feedback`, { feedback }),
}

export const citiesAPI = {
  search: (query: string, limit?: number) => api.get('/cities/search', { params: { q: query, limit } }),
  getByCoordinates: (lat: number, lng: number) => api.get('/cities/by-coordinates', { params: { lat, lng } }),
  updateLocation: (lat: number, lng: number) => api.post('/cities/update-location', null, { params: { lat, lng } }),
}
