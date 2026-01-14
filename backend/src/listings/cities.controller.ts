import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common'
import { CitiesService } from './cities.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get('search')
  async searchCities(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.citiesService.searchCities(query, limit || 10)
  }

  @Get('by-coordinates')
  async getCityByCoordinates(
    @Query('lat') lat: string,
    @Query('lng') lng: string
  ) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return { error: 'Invalid coordinates' }
    }

    return this.citiesService.getCityByCoordinates(latitude, longitude)
  }

  @Post('update-location')
  @UseGuards(JwtAuthGuard)
  async updateUserLocation(
    @Request() req,
    @Query('lat') lat: string,
    @Query('lng') lng: string
  ) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return { error: 'Invalid coordinates' }
    }

    const city = await this.citiesService.getCityByCoordinates(latitude, longitude)
    
    // Обновление города пользователя будет в users service
    return {
      city: city ? city.name : null,
      coordinates: { lat: latitude, lng: longitude },
    }
  }
}
