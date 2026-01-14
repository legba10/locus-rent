'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import { listingsAPI } from '@/lib/api'
import { ArrowLeft, Loader2, MapPin, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/Toast'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    pricePerNight: '',
    maxGuests: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    amenities: [] as string[],
  })
  const [images, setImages] = useState<string[]>([])

  const amenitiesOptions = [
    'wifi', 'kitchen', 'parking', 'airConditioning', 
    'washingMachine', 'tv', 'balcony', 'elevator'
  ]

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    setError('')
  }

  const toggleAmenity = (amenity: string) => {
    const amenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity]
    handleChange('amenities', amenities)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const listingData = {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        maxGuests: parseInt(formData.maxGuests),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        beds: formData.beds ? parseInt(formData.beds) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        images: images,
      }

      await listingsAPI.create(listingData)
      toast('Объявление успешно создано!', 'success')
      router.push('/landlord')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
        'Ошибка создания объявления. Проверьте данные и попробуйте снова.'
      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Кабинет арендодателя', href: '/landlord' },
              { label: 'Создать объявление' }
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Создать объявление</h1>
            <p className="text-gray-600 mt-2">Заполните информацию о вашем жилье</p>
            <Link
              href="/landlord/listings/new-stepper"
              className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-sm"
            >
              Или используйте пошаговый мастер →
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Основная информация */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Основная информация</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Уютная квартира в центре"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Опишите ваше жилье..."
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип жилья *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="apartment">Квартира</option>
                    <option value="house">Дом</option>
                    <option value="studio">Студия</option>
                    <option value="apartment_complex">Апартаменты</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Местоположение */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Местоположение
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Город *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Москва"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ул. Примерная, д. 1"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Широта (опционально)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleChange('latitude', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="55.7558"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Долгота (опционально)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleChange('longitude', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="37.6173"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Цена и вместимость */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Цена и вместимость</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена за ночь (₽) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.pricePerNight}
                    onChange={(e) => handleChange('pricePerNight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="3000"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимум гостей *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxGuests}
                    onChange={(e) => handleChange('maxGuests', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="4"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Спальни
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="2"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Кровати
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.beds}
                    onChange={(e) => handleChange('beds', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="2"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ванные комнаты
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="1"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            {/* Удобства */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Удобства</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenitiesOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                      formData.amenities.includes(amenity)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                    }`}
                    disabled={loading}
                  >
                    {amenity === 'wifi' && 'Wi-Fi'}
                    {amenity === 'kitchen' && 'Кухня'}
                    {amenity === 'parking' && 'Парковка'}
                    {amenity === 'airConditioning' && 'Кондиционер'}
                    {amenity === 'washingMachine' && 'Стиральная машина'}
                    {amenity === 'tv' && 'Телевизор'}
                    {amenity === 'balcony' && 'Балкон'}
                    {amenity === 'elevator' && 'Лифт'}
                  </button>
                ))}
              </div>
            </section>

            {/* Кнопки */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3.5 rounded-lg hover:bg-primary-dark transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать объявление'
                )}
              </button>
              <Link
                href="/landlord"
                className="px-6 py-3.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
