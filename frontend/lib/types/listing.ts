export type ListingType = 'apartment' | 'house' | 'studio' | 'room' | 'apartment_complex'

export type ListingStatus = 'draft' | 'moderation' | 'active' | 'hidden' | 'rejected'

export interface Listing {
  id: string
  title: string
  description: string
  images?: string[]
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
  rating?: number
  reviewsCount?: number
  ownerId: string
  createdAt: string
  updatedAt: string
}
