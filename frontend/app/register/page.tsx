'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/Toast'
import TelegramLogin from '@/components/TelegramLogin'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('Имя обязательно для заполнения')
      return false
    }
    if (!formData.email && !formData.phone) {
      setError('Укажите email или телефон')
      return false
    }
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Нормализация телефона
      let normalizedPhone = formData.phone
      if (normalizedPhone) {
        // Убираем все нецифровые символы
        normalizedPhone = normalizedPhone.replace(/\D/g, '')
        // Если начинается с 8, заменяем на 7
        if (normalizedPhone.startsWith('8')) {
          normalizedPhone = '7' + normalizedPhone.substring(1)
        }
        // Если не начинается с 7, добавляем 7
        if (!normalizedPhone.startsWith('7') && normalizedPhone.length === 10) {
          normalizedPhone = '7' + normalizedPhone
        }
        // Добавляем + в начало
        if (normalizedPhone.startsWith('7')) {
          normalizedPhone = '+' + normalizedPhone
        }
      }

      const registerData: any = {
        firstName: formData.firstName,
        password: formData.password,
      }

      if (formData.lastName) registerData.lastName = formData.lastName
      if (formData.email) registerData.email = formData.email.trim()
      if (normalizedPhone) registerData.phone = normalizedPhone

      const response = await authAPI.register(registerData)
      const { user, accessToken } = response.data

      setSuccess(true)
      setAuth(user, accessToken)
      toast('Регистрация успешна! Добро пожаловать в LOCUS!', 'success')
      
      setTimeout(() => {
        const next = searchParams?.get('next')
        router.push(next || '/')
      }, 1000)
    } catch (err: any) {
      console.error('Registration error:', err)
      
      // Детальная обработка ошибок
      let errorMessage = 'Ошибка регистрации. Попробуйте снова.'
      
      if (err.response) {
        // Ошибка от сервера
        if (err.response.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data?.error) {
          errorMessage = Array.isArray(err.response.data.error) 
            ? err.response.data.error.join(', ')
            : err.response.data.error
        } else if (err.response.status === 400) {
          errorMessage = 'Неверные данные. Проверьте правильность заполнения полей.'
        } else if (err.response.status === 409) {
          errorMessage = 'Пользователь с такими данными уже существует.'
        } else if (err.response.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.'
        }
      } else if (err.request || !err.response) {
        // Запрос отправлен, но ответа нет - backend не запущен
        errorMessage = err.userMessage || 'Сервер не отвечает. Проверьте, что backend запущен на порту 3001.'
      } else {
        // Ошибка при настройке запроса
        errorMessage = err.userMessage || err.message || 'Ошибка при отправке запроса.'
      }
      
      console.error('Registration failed:', {
        error: err,
        message: errorMessage,
        response: err.response?.data,
      })
      
      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-10">
            <Logo size="lg" className="justify-center" />
            <p className="mt-4 text-gray-600 text-lg">Умный выбор жилья</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 backdrop-blur-sm">
            <h1 className="text-4xl font-bold mb-2 text-center text-gray-900 tracking-tight">Создайте аккаунт</h1>
            <p className="text-center text-gray-500 mb-8">Зарегистрируйтесь, чтобы начать искать жильё или размещать объявления</p>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">Регистрация успешна! Перенаправление...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  placeholder="Иван"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  placeholder="Иванов"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                  placeholder="Повторите пароль"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-primary text-white py-4 rounded-xl hover:bg-primary-dark transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Регистрация...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Успешно!
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </form>

            {/* Telegram Login */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-3">Или зарегистрируйтесь через</p>
                <TelegramLogin />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
