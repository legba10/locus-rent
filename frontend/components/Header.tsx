'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, User, LogOut, Home, Shield, Search } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import Logo from './Logo'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-50 shadow-sm">
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
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium py-2 h-full"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">{user?.firstName || 'Меню'}</span>
                </button>
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[10001]"
                    style={{
                      maxWidth: 'calc(100vw - 2rem)',
                      right: 0,
                      left: 'auto'
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 -mr-2"
              aria-label="Меню"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - объединенное */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-[10001] max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {/* Navigation links */}
              <Link
                href="/smart-search"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="w-4 h-4" />
                Умный поиск
              </Link>
              <Link
                href="/landlord/listings/new"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Разместить объявление
              </Link>
              
              {/* User menu items */}
              {isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-100" />
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Профиль
                  </Link>
                  <Link
                    href="/landlord"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4" />
                    Кабинет арендодателя
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'ADMIN' || user?.email === 'feodal.00@bk.ru') && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Админ-панель
                    </Link>
                  )}
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                      router.push('/')
                    }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left text-gray-700 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </>
              )}
              
              {!isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-100" />
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Old Mobile Menu - удаляем */}
        {false && isMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-2 sm:gap-3">
              <Link
                href="/smart-search"
                className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Умный поиск
              </Link>
              <button
                type="button"
                className="text-gray-600 hover:text-primary transition-colors font-medium py-2 text-left"
                onClick={() => {
                  setIsMenuOpen(false)
                  if (isAuthenticated) {
                    router.push('/landlord/listings/new-stepper')
                  } else {
                    router.push('/login?next=/landlord/listings/new-stepper')
                  }
                }}
              >
                Разместить объявление
              </button>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Профиль
                  </Link>
                  <Link
                    href="/landlord"
                    className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Кабинет арендодателя
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'ADMIN' || user?.email === 'feodal.00@bk.ru') && (
                    <Link
                      href="/admin"
                      className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Админ-панель
                    </Link>
                  )}
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                      router.push('/')
                    }}
                    className="text-gray-600 hover:text-primary transition-colors font-medium py-2 text-left"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary text-white px-5 py-3 rounded-xl hover:bg-primary-dark transition-all text-center font-semibold shadow-md hover:shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
