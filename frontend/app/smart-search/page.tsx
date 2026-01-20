'use client'

import { useState } from 'react'
import SmartNavigator from '@/components/SmartNavigator'
import SmartResults from '@/components/SmartResults'
import SmartMapView from '@/components/SmartMapView'
import Breadcrumbs from '@/components/Breadcrumbs'
import { RotateCcw } from 'lucide-react'
import { SmartSearchResults, RecommendationItem } from '@/lib/types/recommendation'
import { Listing } from '@/lib/types/listing'

export default function SmartSearchPage() {
  const [results, setResults] = useState<SmartSearchResults | null>(null)
  const [selectedListing, setSelectedListing] = useState<RecommendationItem | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {!results ? (
            <div className="animate-fade-in">
              <Breadcrumbs items={[{ label: 'Умный поиск' }]} />
              <SmartNavigator onResults={setResults} />
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <Breadcrumbs items={[{ label: 'Умный поиск', href: '/smart-search' }, { label: 'Результаты' }]} />
                  <h1 className="text-3xl font-bold text-gray-900 mt-2">Результаты поиска</h1>
                </div>
                <button
                  onClick={() => setResults(null)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Новый поиск
                </button>
              </div>

              {/* Карта */}
              {results.bestMatch && (
                <SmartMapView
                  bestMatch={results.bestMatch}
                  alternatives={results.alternatives || []}
                  onListingSelect={(item) => setSelectedListing(item as RecommendationItem)}
                />
              )}

              {/* Результаты */}
              <SmartResults 
                bestMatch={results.bestMatch ?? null}
                alternatives={results.alternatives || []}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
