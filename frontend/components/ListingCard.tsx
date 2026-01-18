'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Users, Bed, Bath, Eye } from 'lucide-react'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    address?: string
    city?: string
    pricePerNight?: number
    price?: number
    rating?: number
    reviewsCount?: number
    maxGuests?: number
    guests?: number
    bedrooms?: number
    bathrooms?: number
    images?: string[]
    imageUrl?: string
    views?: number
    viewCount?: number
  }
}

export default function ListingCard({ listing }: ListingCardProps) {
  const price = listing.pricePerNight || listing.price || 0
  const address = listing.address || listing.city || 'Адрес не указан'
  // Гарантируем, что images всегда массив
  const images = Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
  const imageUrl = images[0] || listing.imageUrl || null
  const guests = listing.maxGuests || listing.guests
  const views = listing.views || listing.viewCount || 0

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 group w-full h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет фото</p>
              </div>
            </div>
          )}
          {listing.rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{listing.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm mb-3">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-3 sm:gap-4 text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 flex-wrap">
            {guests && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{guests}</span>
              </div>
            )}
            {listing.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{listing.bathrooms}</span>
              </div>
            )}
            {views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{views}</span>
              </div>
            )}
          </div>

          {/* Price and Rating */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 mt-auto">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {price.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">за ночь</div>
            </div>
            
            {listing.reviewsCount && listing.reviewsCount > 0 && (
              <div className="text-right">
                <div className="text-xs sm:text-sm font-medium text-gray-700">
                  {listing.reviewsCount} {listing.reviewsCount === 1 ? 'отзыв' : listing.reviewsCount < 5 ? 'отзыва' : 'отзывов'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
