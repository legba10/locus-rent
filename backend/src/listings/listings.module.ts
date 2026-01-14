import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ListingsService } from './listings.service'
import { ListingsController } from './listings.controller'
import { CitiesService } from './cities.service'
import { CitiesController } from './cities.controller'
import { Listing } from './entities/listing.entity'
import { City } from './entities/city.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Listing, City])],
  controllers: [ListingsController, CitiesController],
  providers: [ListingsService, CitiesService],
  exports: [ListingsService, CitiesService],
})
export class ListingsModule {}
