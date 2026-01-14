'use client'

import { useEffect, useRef } from 'react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/Toast'

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void
  }
}

export default function TelegramLogin() {
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const router = useRouter()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME

    if (!botName) {
      console.warn('NEXT_PUBLIC_TELEGRAM_BOT_NAME is not set. Telegram Login Widget will not function.')
      return
    }

    // Глобальная функция для обработки авторизации
    window.onTelegramAuth = async (user: any) => {
      try {
        console.log('Telegram auth callback received:', user)
        const response = await authAPI.loginWithTelegram(user)
        const { user: authUser, accessToken } = response.data

        setAuth(authUser, accessToken)
        toast('Вход через Telegram выполнен успешно!', 'success')
        router.push('/')
      } catch (err: any) {
        console.error('Telegram login error:', err)
        const errorMessage = err.response?.data?.message || 
                             err.userMessage ||
                             'Ошибка входа через Telegram. Попробуйте снова.'
        toast(errorMessage, 'error')
      }
    }

    // Загрузка Telegram Login Widget
    const loadWidget = () => {
      const container = document.getElementById('telegram-login-container')
      if (!container) {
        console.warn('Telegram login container not found')
        return
      }

      // Удаляем старый скрипт, если есть
      const oldScript = document.querySelector('script[src*="telegram-widget.js"]')
      if (oldScript) {
        oldScript.remove()
      }

      // Очищаем контейнер
      container.innerHTML = ''

      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', botName)
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-onauth', 'onTelegramAuth(user)')
      script.setAttribute('data-request-access', 'write')
      script.async = true
      script.id = 'telegram-login-script'
      
      script.onerror = () => {
        console.error('Failed to load Telegram widget script')
      }
      
      script.onload = () => {
        console.log('Telegram widget script loaded successfully')
      }
      
      scriptRef.current = script
      container.appendChild(script)
    }

    // Небольшая задержка, чтобы DOM был готов
    const timeoutId = setTimeout(loadWidget, 100)

    return () => {
      clearTimeout(timeoutId)
      // Очистка при размонтировании
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
        scriptRef.current = null
      }
      // @ts-ignore
      delete window.onTelegramAuth
    }
  }, [setAuth, router])

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME

  if (!botName) {
    // Если бот не настроен, аккуратно скрываем кнопку, чтобы не ломать UX
    return null
  }

  return (
    <div className="flex justify-center">
      <div id="telegram-login-container"></div>
    </div>
  )
}
