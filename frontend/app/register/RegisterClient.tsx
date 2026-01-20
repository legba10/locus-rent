'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/Toast'
import TelegramLogin from '@/components/TelegramLogin'
import { RegisterPayload } from '@/lib/types/auth'

function RegisterForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Валидация
    if (!formData.firstName.trim()) {
      setError('Укажите имя')
      return
    }

    if (!formData.password) {
      setError('Укажите пароль')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (!formData.email && !formData.phone) {
      setError('Укажите email или телефон')
      return
    }

    setLoading(true)

    try {
      // Нормализация телефона
      let normalizedPhone: string | undefined = undefined
      if (formData.phone) {
        normalizedPhone = formData.phone.replace(/\D/g, '')
        if (normalizedPhone.length === 10) {
          normalizedPhone = '+7' + normalizedPhone
        } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('7')) {
          normalizedPhone = '+' + normalizedPhone
        } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('8')) {
          normalizedPhone = '+7' + normalizedPhone.substring(1)
        } else if (!normalizedPhone.startsWith('+')) {
          normalizedPhone = '+' + normalizedPhone
        }
      }

      const registerData: RegisterPayload = {
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
      }, 1500)
    } catch (err: any) {
      console.error('Register error:', err)

      let errorMessage = 'Ошибка регистрации. Проверьте данные и попробуйте снова.'

      if (err.response) {
        if (err.response.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data?.error) {
          errorMessage = Array.isArray(err.response.data.error)
            ? err.response.data.error.join(', ')
            : err.response.data.error
        } else if (err.response.status === 409) {
          errorMessage = 'Пользователь с таким email или телефоном уже существует.'
        } else if (err.response.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.'
        }
      } else if (err.request) {
        errorMessage =
          'Сервер не отвечает. Проверьте подключение к интернету и убедитесь, что backend запущен.'
      } else {
        errorMessage = err.message || 'Ошибка при отправке запроса.'
      }

      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 mb-4 sm:mb-6">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Регистрация успешна!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Вы будете перенаправлены...
            </p>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <Logo size="lg" className="justify-center mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Регистрация в LOCUS
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Создайте аккаунт, чтобы начать
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ваше имя"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Фамилия
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ваша фамилия"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Подтвердите пароль <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="text-xs text-gray-500">
              <p>Укажите email или телефон (хотя бы одно поле обязательно)</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          {/* Telegram login */}
          <div className="mt-6">
            <TelegramLogin />
          </div>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RegisterClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}

