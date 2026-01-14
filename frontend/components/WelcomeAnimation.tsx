'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo'

interface WelcomeAnimationProps {
  onComplete: () => void
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [moveToHeader, setMoveToHeader] = useState(false)

  useEffect(() => {
    // Этап 1: Появление логотипа (80ms)
    const showTimer = setTimeout(() => setShowContent(true), 80)

    // Этап 2: Пульсация внутренней точки (через 600ms после появления)
    const pulseTimer = setTimeout(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 400)
    }, 680)

    // Этап 3: Перемещение в header (через 1200ms после появления)
    const moveTimer = setTimeout(() => {
      setMoveToHeader(true)
    }, 1200)

    // Этап 4: Завершение анимации (через 2000ms)
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300)
    }, 2000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(pulseTimer)
      clearTimeout(moveTimer)
      clearTimeout(hideTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center overflow-hidden">
      <div
        className={`transform-gpu transition-all duration-700 ease-out ${
          moveToHeader
            ? 'opacity-0 scale-50 -translate-y-[calc(50vh-2rem)] -translate-x-[calc(50vw-4rem)]'
            : showContent
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-4'
        }`}
        style={{
          filter: showContent && !moveToHeader ? 'blur(0px)' : 'blur(0px)',
        }}
      >
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Крупный логотип в центре */}
            <Logo size="lg" showText={true} className="justify-center" />
            {/* Пульсирующее свечение вокруг логотипа */}
            <div
              className={`pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl transition-all duration-400 ${
                pulse ? 'scale-150 opacity-60' : 'scale-100 opacity-30'
              }`}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .duration-700 {
          transition-duration: 700ms;
        }
        .duration-400 {
          transition-duration: 400ms;
        }
      `}</style>
    </div>
  )
}



