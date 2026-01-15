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
      {/* LOCUS Logo: Map marker pin with integrated human figure and house silhouette */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center`}>
        <svg
          viewBox="0 0 64 80"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="locusGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0A3D91" />
              <stop offset="50%" stopColor="#1E5ED8" />
              <stop offset="100%" stopColor="#6FA8FF" />
            </linearGradient>
          </defs>
          
          {/* Map marker pin shape (teardrop with smooth bottom point) */}
          <path
            d="M32 8 C24 8, 18 14, 18 22 C18 30, 32 72, 32 72 C32 72, 46 30, 46 22 C46 14, 40 8, 32 8 Z"
            fill="url(#locusGradient)"
          />
          
          {/* House silhouette integrated into pin (centered, below human) */}
          <g transform="translate(32, 35)">
            {/* Roof with clear angle */}
            <path
              d="M-9 -7 L0 -14 L9 -7 Z"
              fill="white"
              fillOpacity="0.95"
            />
            {/* House body */}
            <rect
              x="-9"
              y="-7"
              width="18"
              height="14"
              fill="white"
              fillOpacity="0.95"
            />
            {/* Windows (2x2 grid, perfectly aligned and evenly spaced) */}
            <rect
              x="-6.5"
              y="-4.5"
              width="3.5"
              height="3.5"
              fill="#1E5ED8"
              fillOpacity="0.5"
            />
            <rect
              x="3"
              y="-4.5"
              width="3.5"
              height="3.5"
              fill="#1E5ED8"
              fillOpacity="0.5"
            />
            <rect
              x="-6.5"
              y="1"
              width="3.5"
              height="3.5"
              fill="#1E5ED8"
              fillOpacity="0.5"
            />
            <rect
              x="3"
              y="1"
              width="3.5"
              height="3.5"
              fill="#1E5ED8"
              fillOpacity="0.5"
            />
          </g>
          
          {/* Human figure (abstract, minimal, flowing curved shapes, calm confident posture) */}
          <g transform="translate(32, 18)">
            {/* Head (simple circle) */}
            <circle
              cx="0"
              cy="-10"
              r="3.5"
              fill="white"
              fillOpacity="0.95"
            />
            {/* Body (flowing curved shape, no detailed limbs) */}
            <path
              d="M-2.5 -6.5 Q0 -3, 2.5 -6.5 Q2.5 0, 0 3 Q-2.5 0, -2.5 -6.5 Z"
              fill="white"
              fillOpacity="0.95"
            />
          </g>
          
          {/* Center point (locus) - subtle */}
          <circle
            cx="32"
            cy="24"
            r="1.8"
            fill="#0A3D91"
            fillOpacity="0.7"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-semibold ${currentSize.text} tracking-wide`} style={{ color: '#1E5ED8' }}>
          LOCUS
        </span>
      )}
    </Link>
  )
}
