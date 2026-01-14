'use client'

import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', gap: 'gap-2' },
    lg: { icon: 'w-16 h-16', text: 'text-4xl', gap: 'gap-3' },
  }

  const currentSize = sizeClasses[size]

  return (
    <Link href="/" className={`flex items-center ${currentSize.gap} ${className} group`}>
      {/* Знак LOCUS: маркер карты с домом внутри */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center`}>
        {/* Маркер карты с домом внутри */}
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Внешний контур маркера (капля) */}
          <path
            d="M32 8C24 8 18 14 18 22C18 30 32 56 32 56C32 56 46 30 46 22C46 14 40 8 32 8Z"
            fill="currentColor"
            className="text-primary"
          />
          {/* Крыша дома */}
          <path
            d="M32 18L26 24H38L32 18Z"
            fill="white"
            fillOpacity="0.98"
          />
          {/* Стены дома */}
          <rect
            x="26"
            y="24"
            width="12"
            height="10"
            fill="white"
            fillOpacity="0.98"
          />
          {/* Дверь */}
          <rect
            x="29"
            y="28"
            width="4"
            height="6"
            fill="currentColor"
            className="text-primary"
            fillOpacity="0.3"
          />
          {/* Точка-центр (locus) */}
          <circle cx="32" cy="26" r="1.5" fill="currentColor" className="text-primary" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${currentSize.text} tracking-tight text-primary`}>
          LOCUS
        </span>
      )}
    </Link>
  )
}
