import { useEffect, useState } from 'react'
import Logo from './Logo'

interface WelcomeAnimationProps {
  onComplete: () => void
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setShowContent(true), 80)

    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      // Вызываем onComplete сразу после скрытия, без задержки
      onComplete()
    }, 2200)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [onComplete])

  // КРИТИЧНО: Полностью удаляем из DOM, когда невидим
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[1050] bg-white flex items-center justify-center overflow-hidden">
      <div
        className={`transform-gpu transition-all duration-600 ${
          showContent ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Large logo in center */}
            <Logo size="lg" showText={true} className="justify-center" />
            {/* Subtle soft glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-blue-500/10 blur-2xl" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </div>
  )
}
