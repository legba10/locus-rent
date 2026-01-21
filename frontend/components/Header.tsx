'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, User, LogOut, Home, Shield, Search } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import Logo from './Logo'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userMenuPosition, setUserMenuPosition] = useState<{ right: number; top: number; maxWidth: number } | null>(null)
  const userMenuButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  // Calculate user menu position - улучшенная логика для предотвращения обрезания
  useEffect(() => {
    // 🔴 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
    return

    if (isUserMenuOpen && userMenuButtonRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        const rect = userMenuButtonRef.current?.getBoundingClientRect()
        if (!rect) return

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const menuWidth = 224 // w-56 = 14rem = 224px
        const menuHeight = 200 // примерная высота меню
        const padding = 16 // 1rem

        // Проверяем, выходит ли меню за правый край
        const spaceRight = viewportWidth - rect.right
        const spaceLeft = rect.left
        const spaceBelow = viewportHeight - rect.bottom

        let right = 0
        let top = rect.bottom + 8
        let maxWidth = Math.min(menuWidth, viewportWidth - padding * 2)

        // Проверяем правый край
        if (spaceRight >= menuWidth) {
          // Помещается справа - выравниваем по левому краю кнопки
          right = viewportWidth - rect.right
        } else if (spaceLeft >= menuWidth) {
          // Помещается слева - выравниваем по правому краю кнопки
          right = viewportWidth - rect.left
        } else {
          // Не помещается ни справа, ни слева - выравниваем по краю viewport с padding
          right = padding
          maxWidth = Math.min(menuWidth, viewportWidth - padding * 2)
        }

        // Проверяем нижний край - если меню выходит за нижний край, открываем сверху
        if (spaceBelow < menuHeight && rect.top >= menuHeight) {
          top = rect.top - menuHeight - 8
        } else {
          top = rect.bottom + 8
        }

        setUserMenuPosition({ right, top, maxWidth })
      }

      updatePosition()
      const handleResize = () => requestAnimationFrame(updatePosition)
      const handleScroll = () => requestAnimationFrame(updatePosition)
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    } else {
      setUserMenuPosition(null)
    }
  }, [isUserMenuOpen])

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-[1020] shadow-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Logo showText={true} />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            <Link
              href="/smart-search"
              className="text-gray-600 hover:text-primary transition-colors font-medium py-2 flex items-center h-full"
            >
              Умный поиск
            </Link>
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  router.push('/landlord/listings/new-stepper')
                } else {
                  router.push('/login?next=/landlord/listings/new-stepper')
                }
              }}
              className="text-gray-600 hover:text-primary transition-colors font-medium py-2 flex items-center h-full"
            >
              Разместить объявление
            </button>
            {isAuthenticated ? (
              <div className="relative h-full flex items-center" style={{ zIndex: 1000 }}>
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium py-2 h-full"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">{user?.firstName || 'Меню'}</span>
                </button>
                {isUserMenuOpen && (
                  <div 
                    ref={userMenuRef}
                    className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[10001]"
                    style={{
                      right: '1rem',
                      top: userMenuButtonRef.current ? `${userMenuButtonRef.current.getBoundingClientRect().bottom + 8}px` : 'auto',
                      width: '224px',
                      minWidth: '200px',
                      maxWidth: 'calc(100vw - 2rem)',
                      maxHeight: 'calc(100vh - 2rem)',
                      overflowY: 'auto'
                    }}
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Профиль
                    </Link>
                    <Link
                      href="/landlord"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Home className="w-4 h-4" />
                      Кабинет арендодателя
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'ADMIN' || user?.email === 'feodal.00@bk.ru') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Админ-панель
                      </Link>
                    )}
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                        router.push('/')
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left text-gray-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 h-full">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary transition-colors font-medium py-2 flex items-center h-full"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-md hover:shadow-lg font-semibold transform hover:scale-105 active:scale-95 flex items-center h-full"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 -mr-2 cursor-pointer"
              aria-label="Меню"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - объединенное */}
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[1040]"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Menu */}
            <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl z-[1050] max-h-[calc(100vh-4rem)] overflow-y-auto" style={{ maxWidth: '100vw' }}>
              <div className="px-4 py-4 space-y-1">
                {/* Navigation links */}
                <Link
                  href="/smart-search"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Search className="w-5 h-5 flex-shrink-0" />
                  Умный поиск
                </Link>
                <Link
                  href={isAuthenticated ? "/landlord/listings/new-stepper" : "/login?next=/landlord/listings/new-stepper"}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  Разместить объявление
                </Link>
                
                {/* User menu items */}
                {isAuthenticated && (
                  <>
                    <hr className="my-3 border-gray-200" />
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5 flex-shrink-0" />
                      Профиль
                    </Link>
                    <Link
                      href="/landlord"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 flex-shrink-0" />
                      Кабинет арендодателя
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'ADMIN' || user?.email === 'feodal.00@bk.ru') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="w-5 h-5 flex-shrink-0" />
                        Админ-панель
                      </Link>
                    )}
                    <hr className="my-3 border-gray-200" />
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                        router.push('/')
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left text-gray-700 rounded-lg font-medium"
                    >
                      <LogOut className="w-5 h-5 flex-shrink-0" />
                      Выйти
                    </button>
                  </>
                )}
                
                {!isAuthenticated && (
                  <>
                    <hr className="my-3 border-gray-200" />
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg font-medium border border-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Войти
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white hover:bg-primary-dark transition-colors rounded-lg font-semibold shadow-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Регистрация
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </header>
  )
}
