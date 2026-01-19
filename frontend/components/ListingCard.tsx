'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Star, Users, Bed, Bath, Eye, Image as ImageIcon } from 'lucide-react'
import { normalizeImageSrc, sanitizeImages } from '@/lib/imageUtils'

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
  const [imageLoading, setImageLoading] = useState<boolean>(true)
  const [imageError, setImageError] = useState(false)
  
  const price = listing.pricePerNight || listing.price || 0
  const address = listing.address || listing.city || 'Адрес не указан'
  
  // КРИТИЧНО: санитизация images с гарантией массива
  const validImages = sanitizeImages(listing.images)
  const imageSrc = normalizeImageSrc(validImages[0] || listing.imageUrl)
  const guests = listing.maxGuests || listing.guests
  const views = listing.views || listing.viewCount || 0

  const hasImage = imageSrc !== '/placeholder-image.svg' && !imageError

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 group w-full h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-100 overflow-hidden">
          {/* Image or Fallback */}
          {hasImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 z-0" />
              )}
              <img
                src={imageSrc}
                alt={listing.title || 'Объявление'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
                onLoad={() => {
                  setImageLoading(false)
                  setImageError(false)
                }}
                onError={(e) => {
                  console.error('Image load error in ListingCard:', imageSrc)
                  setImageLoading(false)
                  setImageError(true)
                  ;(e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'
                }}
              />
            </>
          ) : (
            <img
              src="/placeholder-image.svg"
              alt="Фото скоро появится"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
          
          {listing.rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 z-10">
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
