import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RecommendationEngineService } from './recommendation-engine.service'
import { SmartNavigatorService } from './smart-navigator.service'
import { TrustService } from './trust/trust.service'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { RecommendationController } from './recommendation.controller'
import { SearchSession } from './entities/search-session.entity'
import { Recommendation } from './entities/recommendation.entity'
import { UserPreference } from './entities/user-preference.entity'
import { Listing } from '../listings/entities/listing.entity'
import { Booking } from '../bookings/entities/booking.entity'
import { Review } from '../reviews/entities/review.entity'
import { User } from '../users/entities/user.entity'
import { ListingsModule } from '../listings/listings.module'
import { BookingsModule } from '../bookings/bookings.module'
import { ReviewsModule } from '../reviews/reviews.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SearchSession,
      Recommendation,
      UserPreference,
      Listing,
      Booking,
      Review,
      User,
    ]),
    ListingsModule,
    BookingsModule,
    ReviewsModule,
    UsersModule,
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationEngineService,
    SmartNavigatorService,
    TrustService,
    ScoringEngineService,
  ],
  exports: [
    RecommendationEngineService,
    SmartNavigatorService,
    ScoringEngineService,
  ],
})
export class RecommendationModule {}
