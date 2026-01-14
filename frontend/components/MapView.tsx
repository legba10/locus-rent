'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapViewProps {
  listings: any[]
}

export default function MapView({ listings }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) {
      console.error('Mapbox token not found')
      return
    }

    mapboxgl.accessToken = mapboxToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [37.6173, 55.7558], // Москва по умолчанию
      zoom: 10,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Добавление фирменной геометки LOCUS
    if (map.current) {
      const el = document.createElement('div')
      el.className = 'locus-marker'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#3390ec'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      new mapboxgl.Marker(el)
        .setLngLat([37.6173, 55.7558])
        .setPopup(
          new mapboxgl.Popup().setHTML('<div class="p-2"><strong>LOCUS</strong><br/>Умный выбор жилья</div>')
        )
        .addTo(map.current)
    }

    return () => {
      map.current?.remove()
    }
  }, [])

  // Добавление маркеров для объявлений
  useEffect(() => {
    if (!map.current || !mapLoaded || listings.length === 0) return

    // Очистка существующих маркеров
    const markers: mapboxgl.Marker[] = []

    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        const el = document.createElement('div')
        el.className = 'listing-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#2a7bc8'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        el.style.cursor = 'pointer'

        const marker = new mapboxgl.Marker(el)
          .setLngLat([listing.longitude, listing.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div class="p-3">
                <h3 class="font-bold mb-1">${listing.title}</h3>
                <p class="text-sm text-gray-600 mb-2">${listing.address}</p>
                <p class="text-lg font-bold text-primary">${listing.price} ₽/ночь</p>
              </div>`
            )
          )
          .addTo(map.current!)

        markers.push(marker)
      }
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [listings, mapLoaded])

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-soft">
      <div ref={mapContainer} className="w-full h-full" />
      <style jsx global>{`
        .mapboxgl-popup-content {
          border-radius: 12px;
          padding: 0;
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px;
        }
      `}</style>
    </div>
  )
}
