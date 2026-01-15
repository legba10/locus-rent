'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from '@/components/Toast'
import TelegramLogin from '@/components/TelegramLogin'
import { LoginPayload } from '@/lib/types/auth'

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loginData: LoginPayload = loginMethod === 'email' 
        ? { email, password }
        : { phone, password }

      const response = await authAPI.login(loginData)
      const { user, accessToken } = response.data

      setAuth(user, accessToken)
      toast('Вход выполнен успешно!', 'success')
      const next = searchParams?.get('next')
      router.push(next || '/')
    } catch (err: any) {
      console.error('Login error:', err)
      
      let errorMessage = 'Ошибка входа. Проверьте данные и попробуйте снова.'
      
      if (err.response) {
        // Ошибка от сервера
        if (err.response.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data?.error) {
          errorMessage = Array.isArray(err.response.data.error) 
            ? err.response.data.error.join(', ')
            : err.response.data.error
        } else if (err.response.status === 401) {
          errorMessage = 'Неверный email/телефон или пароль.'
        } else if (err.response.status >= 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.'
        }
      } else if (err.request) {
        // Запрос отправлен, но ответа нет
        errorMessage = 'Сервер не отвечает. Проверьте подключение к интернету и убедитесь, что backend запущен.'
      } else {
        // Ошибка при настройке запроса
        errorMessage = err.message || 'Ошибка при отправке запроса.'
      }
      
      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-4xl font-bold mb-2 text-center text-gray-900 tracking-tight">Войдите в аккаунт</h1>
            <p className="text-center text-gray-500 mb-8">Введите email или телефон и пароль</p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Toggle Login Method */}
            <div className="flex gap-2 mb-6 bg-gray-50 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email')
                  setError('')
                }}
                className={`flex-1 py-2.5 rounded-md transition-all font-medium ${
                  loginMethod === 'email'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone')
                  setError('')
                }}
                className={`flex-1 py-2.5 rounded-md transition-all font-medium ${
                  loginMethod === 'phone'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Телефон
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setError('')
                    }}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white hover:border-gray-300"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl hover:bg-primary-dark transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            {/* Telegram Login */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-3">Или войдите через</p>
                <TelegramLogin />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-primary hover:text-primary-dark font-medium">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
