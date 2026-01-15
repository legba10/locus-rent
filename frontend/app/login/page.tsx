'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from '@/components/Toast'
import TelegramLogin from '@/components/TelegramLogin'
import { LoginPayload } from '@/lib/types/auth'

export const dynamic = 'force-dynamic'

function LoginForm() {
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход в LOCUS</h1>
            <p className="text-gray-600">Войдите, чтобы продолжить</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Method selector */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'phone'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Телефон
              </button>
            </div>

            {/* Email or Phone input */}
            {loginMethod === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Telegram login */}
          <div className="mt-6">
            <TelegramLogin />
          </div>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
