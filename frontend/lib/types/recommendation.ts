import { Listing } from './listing'

export interface RecommendationItem {
  listing: Listing
  score: number
  explanation?: {
    primaryReason: string
    factors: Array<{
      name: string
      score: number
      description: string
    }>
  }
}

export interface SmartSearchResults {
  bestMatch?: RecommendationItem | null
  alternatives?: RecommendationItem[]
  explanation?: string
}
