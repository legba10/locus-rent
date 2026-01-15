'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { RecommendationItem } from '@/lib/types/recommendation'

interface SmartMapViewProps {
  bestMatch: RecommendationItem | null
  alternatives: RecommendationItem[]
  onListingSelect?: (listing: any) => void
}

export default function SmartMapView({ bestMatch, alternatives, onListingSelect }: SmartMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      console.error('Mapbox token not found')
      return
    }

    mapboxgl.accessToken = mapboxToken

    const centerListing = bestMatch?.listing || alternatives[0]?.listing
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: centerListing?.latitude && centerListing?.longitude
        ? [centerListing.longitude, centerListing.latitude]
        : [37.6173, 55.7558],
      zoom: 12,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Добавление маркеров
  useEffect(() => {
    if (!map.current || !mapLoaded || (!bestMatch && alternatives.length === 0)) return

    // Очистка существующих маркеров
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Главный вариант
    if (bestMatch && bestMatch.listing) {
      const listing = bestMatch.listing
      if (listing.latitude && listing.longitude) {
        addMarker(listing, true, bestMatch.score, 0)
      }
    }

    // Альтернативы
    alternatives.forEach((item, index) => {
      const listing = item.listing
      if (listing.latitude && listing.longitude) {
        addMarker(listing, false, 0.5, index + 1)
      }
    })

    // Фит к маркерам
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      markersRef.current.forEach((marker) => {
        const lngLat = marker.getLngLat()
        bounds.extend([lngLat.lng, lngLat.lat])
      })
      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 14,
      })
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
    }
  }, [bestMatch, alternatives, mapLoaded])

  const addMarker = (
    listing: any,
    isBest: boolean,
    score: number,
    index: number
  ) => {
    if (!map.current) return

    // Создание кастомного маркера
    const el = document.createElement('div')
    el.className = 'smart-marker'
    
    // Размер зависит от того, лучший ли это вариант
    const size = isBest ? 40 : 30
    const opacity = isBest ? 1 : 0.6
    
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.borderRadius = '50%'
    el.style.backgroundColor = isBest ? '#3390ec' : '#2a7bc8'
    el.style.border = isBest ? '4px solid white' : '3px solid white'
    el.style.boxShadow = isBest 
      ? '0 4px 12px rgba(51, 144, 236, 0.6)' 
      : '0 2px 8px rgba(0,0,0,0.3)'
    el.style.cursor = 'pointer'
    el.style.opacity = opacity.toString()
    el.style.transition = 'all 0.3s'
    el.style.position = 'relative'
    
    // Пульсация для лучшего варианта
    if (isBest) {
      el.style.animation = 'pulse-soft 2s ease-in-out infinite'
    }

    // Индикатор score (только для лучшего)
    if (isBest && score > 0) {
      const scoreEl = document.createElement('div')
      scoreEl.style.position = 'absolute'
      scoreEl.style.top = '-8px'
      scoreEl.style.right = '-8px'
      scoreEl.style.width = '20px'
      scoreEl.style.height = '20px'
      scoreEl.style.borderRadius = '50%'
      scoreEl.style.backgroundColor = '#51cf66'
      scoreEl.style.border = '2px solid white'
      scoreEl.style.display = 'flex'
      scoreEl.style.alignItems = 'center'
      scoreEl.style.justifyContent = 'center'
      scoreEl.style.fontSize = '10px'
      scoreEl.style.fontWeight = 'bold'
      scoreEl.style.color = 'white'
      scoreEl.textContent = Math.round(score * 100).toString()
      el.appendChild(scoreEl)
    }

    const marker = new mapboxgl.Marker(el)
      .setLngLat([listing.longitude, listing.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-3" style="min-width: 200px;">
            <h3 class="font-bold mb-1">${listing.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${listing.address}</p>
            ${isBest ? '<div class="text-xs text-primary font-medium mb-2">⭐ Лучший вариант</div>' : ''}
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-primary">${listing.pricePerNight} ₽</span>
              ${isBest && score > 0 ? `<span class="text-xs text-gray-500">${Math.round(score * 100)}%</span>` : ''}
            </div>
          </div>`
        )
      )
      .addTo(map.current)

    el.addEventListener('click', () => {
      if (onListingSelect) {
        onListingSelect(listing)
      }
    })

    markersRef.current.push(marker)
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-soft relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Легенда */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="text-sm font-medium mb-2">Легенда</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary border-2 border-white"></div>
            <span>Лучший вариант</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary-dark border-2 border-white opacity-70"></div>
            <span>Альтернативы</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mapboxgl-popup-content {
          border-radius: 12px;
          padding: 0;
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px;
        }
        @keyframes pulse-soft {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}
