'use client'

import { CheckCircle, MapPin, Star, Info } from 'lucide-react'
import Link from 'next/link'

interface SmartResultsProps {
  bestMatch: {
    listing: any
    score: number
    explanation: {
      primaryReason: string
      factors: Array<{
        name: string
        score: number
        description: string
      }>
    }
  } | null
  alternatives: any[]
}

export default function SmartResults({ bestMatch, alternatives }: SmartResultsProps) {
  if (!bestMatch) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <MapPin className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Варианты не найдены
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          К сожалению, подходящих вариантов не найдено. Попробуйте изменить параметры поиска.
        </p>
      </div>
    )
  }

  const listing = bestMatch.listing

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">
              LOCUS нашёл лучший вариант для вас
            </h3>
            <p className="text-text-secondary">
              Мы проанализировали все доступные объявления LOCUS и выбрали оптимальный вариант
            </p>
          </div>
        </div>
      </div>

      {/* Главный вариант */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden ring-2 ring-primary">
        <div className="bg-primary text-white px-4 py-2 text-sm font-medium text-center">
          ⭐ Лучший вариант
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{listing.title}</h3>
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <MapPin className="w-4 h-4" />
                <span>{listing.address}</span>
              </div>
              {listing.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{Number(listing.rating).toFixed(1)}</span>
                  <span className="text-text-secondary text-sm">
                    ({listing.reviewsCount || 0} отзывов)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {listing.pricePerNight} ₽
              </div>
              <div className="text-sm text-text-secondary">за ночь</div>
            </div>
          </div>

          {/* Объяснение рекомендации */}
          <div className="bg-bg rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-2">{bestMatch.explanation.primaryReason}</p>
                <div className="space-y-1">
                  {bestMatch.explanation.factors.map((factor, idx) => (
                    <div key={idx} className="text-sm text-text-secondary">
                      <span className="font-medium">{factor.name}:</span> {factor.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-secondary">Оценка LOCUS</span>
              <span className="font-medium">{Math.round(bestMatch.score * 100)}%</span>
            </div>
            <div className="w-full bg-bg rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${bestMatch.score * 100}%` }}
              />
            </div>
          </div>

          <Link
            href={`/listings/${listing.id}`}
            className="block w-full bg-primary text-white text-center py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            Подробнее
          </Link>
        </div>
      </div>

      {/* Альтернативы */}
      {alternatives.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Альтернативные варианты</h3>
          <div className="space-y-4">
            {alternatives.map((altListing) => (
              <div
                key={altListing.id}
                className="bg-white rounded-xl shadow-soft overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{altListing.title}</h3>
                      <div className="flex items-center gap-2 text-text-secondary mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{altListing.address}</span>
                      </div>
                      {altListing.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="font-medium">{Number(altListing.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {altListing.pricePerNight} ₽
                      </div>
                      <div className="text-sm text-text-secondary">за ночь</div>
                    </div>
                  </div>
                  <Link
                    href={`/listings/${altListing.id}`}
                    className="block w-full bg-primary text-white text-center py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
