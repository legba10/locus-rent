export type ListingType = 'apartment' | 'house' | 'studio' | 'room' | 'apartment_complex'

export type ListingStatus = 'draft' | 'pending_moderation' | 'moderation' | 'approved' | 'active' | 'needs_revision' | 'rejected' | 'hidden'

export interface Listing {
  id: string
  title: string
  description: string
  images: string[] // Всегда массив, никогда null/undefined
  type: ListingType
  city: string
  district?: string
  address: string
  latitude?: number
  longitude?: number
  pricePerNight: number
  pricePerWeek?: number
  pricePerMonth?: number
  maxGuests: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  amenities?: string[]
  houseRules?: string
  status: ListingStatus
  revisionReason?: string
  rating?: number
  reviewsCount?: number
  views?: number
  ownerId: string
  createdAt: string
  updatedAt: string
}
