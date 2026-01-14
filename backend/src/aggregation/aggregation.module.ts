import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AggregationEngineService } from './aggregation-engine.service'
import { SmartNavigatorService } from './smart-navigator.service'
import { AntifraudService } from './antifraud/antifraud.service'
import { NormalizerService } from './normalizers/normalizer.service'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { LocusNormalizer } from './normalizers/locus-normalizer.service'
import { AvitoNormalizer } from './normalizers/avito-normalizer.service'
import { SutochnoNormalizer } from './normalizers/sutochno-normalizer.service'
import { LocusSourceService } from './sources/locus-source.service'
import { AvitoSourceService } from './sources/avito-source.service'
import { SutochnoSourceService } from './sources/sutochno-source.service'
import { AggregationController } from './aggregation.controller'
import { AggregatedListing } from './entities/aggregated-listing.entity'
import { SearchSession } from './entities/search-session.entity'
import { Recommendation } from './entities/recommendation.entity'
import { UserPreference } from './entities/user-preference.entity'
import { Listing } from '../listings/entities/listing.entity'
import { ListingsModule } from '../listings/listings.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AggregatedListing,
      SearchSession,
      Recommendation,
      UserPreference,
      Listing,
    ]),
    ListingsModule,
  ],
  controllers: [AggregationController],
  providers: [
    AggregationEngineService,
    SmartNavigatorService,
    AntifraudService,
    NormalizerService,
    ScoringEngineService,
    LocusNormalizer,
    AvitoNormalizer,
    SutochnoNormalizer,
    LocusSourceService,
    AvitoSourceService,
    SutochnoSourceService,
  ],
  exports: [
    AggregationEngineService,
    SmartNavigatorService,
    ScoringEngineService,
  ],
})
export class AggregationModule {}
