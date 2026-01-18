import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'LOCUS — умный выбор жилья',
  description: 'Современный сервис для поиска и бронирования жилья',
  keywords: 'аренда жилья, бронирование, квартиры, дома, LOCUS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
