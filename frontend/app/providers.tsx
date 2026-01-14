'use client'

import { QueryClient, QueryClientProvider } from 'react-query'
import { useState, useEffect } from 'react'
import ToastContainer from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import SupportChat from '@/components/SupportChat'
import { useAuthStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 минут
          },
        },
      })
  )

  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    // Инициализация авторизации при монтировании провайдера
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
        <ConfirmDialog />
        <SupportChat />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
