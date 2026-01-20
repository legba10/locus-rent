'use client'

import Link from 'next/link'
import Logo from './Logo'
import { MapPin, Mail, Phone, Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo и описание */}
          <div className="col-span-1 md:col-span-2">
            <Logo size="md" showText={true} className="mb-4" />
            <p className="text-gray-600 mb-4 max-w-md">
              LOCUS — умный сервис подбора жилья для суточной аренды. 
              Находим лучшие варианты быстро и без лишнего шума.
            </p>
            <div className="flex gap-4">
              <button type="button" className="text-gray-400 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </button>
              <button type="button" className="text-gray-400 hover:text-primary transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/smart-search" className="text-gray-600 hover:text-primary transition-colors">
                  Умный поиск
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-primary transition-colors">
                  Разместить объявление
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@locus.ru" className="hover:text-primary transition-colors">
                  info@locus.ru
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <a href="tel:+79991234567" className="hover:text-primary transition-colors">
                  +7 (999) 123-45-67
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Москва, Россия</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Копирайт */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} LOCUS. Все права защищены.
          </p>
          <div className="flex gap-6 text-sm">
            <button type="button" className="text-gray-600 hover:text-primary transition-colors">
              Политика конфиденциальности
            </button>
            <button type="button" className="text-gray-600 hover:text-primary transition-colors">
              Условия использования
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
