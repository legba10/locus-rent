import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common'
import { AggregationEngineService } from './aggregation-engine.service'
import { SmartNavigatorService } from './smart-navigator.service'
import { AntifraudService } from './antifraud/antifraud.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SmartSearchDto } from './dto/smart-search.dto'

@Controller('aggregation')
export class AggregationController {
  constructor(
    private aggregationEngine: AggregationEngineService,
    private smartNavigator: SmartNavigatorService,
    private antifraudService: AntifraudService
  ) {}

  /**
   * Агрегация объявлений из всех источников
   */
  @Get('listings')
  async getAggregatedListings(
    @Query('city') city?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string
  ) {
    const params: any = {}
    if (city) params.city = city
    if (lat && lng) {
      params.coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: radius ? parseFloat(radius) : 10,
      }
    }
    if (limit) params.limit = parseInt(limit)

    return this.aggregationEngine.getAggregatedListings(params)
  }

  /**
   * Умный навигатор - подбор лучших вариантов
   */
  @Post('smart-search')
  @UseGuards(JwtAuthGuard)
  async smartSearch(@Body() dto: SmartSearchDto, @Request() req: any) {
    return this.smartNavigator.findBestOptions({
      userId: req.user?.id,
      tripPurpose: dto.tripPurpose,
      checkIn: new Date(dto.checkIn),
      checkOut: new Date(dto.checkOut),
      budget: dto.budget,
      priorities: dto.priorities,
      city: dto.city,
      coordinates: dto.coordinates,
    })
  }

  /**
   * История поисков пользователя
   */
  @Get('search-history')
  @UseGuards(JwtAuthGuard)
  async getSearchHistory(@Request() req: any) {
    return this.smartNavigator.getSearchHistory(req.user.id)
  }

  /**
   * Сохранение предпочтений пользователя
   */
  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  async savePreferences(@Body() body: any, @Request() req: any) {
    return this.smartNavigator.saveUserPreferences(req.user.id, body.preferences)
  }

  /**
   * Получение предпочтений пользователя
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req: any) {
    return this.smartNavigator.getUserPreferences(req.user.id)
  }

  /**
   * Синхронизация источников (для админов)
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncSources(@Request() req: any) {
    // TODO: Добавить проверку на админа
    await this.aggregationEngine.syncSources()
    return { success: true, message: 'Sources synced' }
  }

  /**
   * Обновление trust scores (для админов)
   */
  @Post('update-trust-scores')
  @UseGuards(JwtAuthGuard)
  async updateTrustScores(@Request() req: any) {
    // TODO: Добавить проверку на админа
    await this.antifraudService.updateTrustScores()
    return { success: true, message: 'Trust scores updated' }
  }
}
