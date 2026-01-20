import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
import { RecommendationEngineService } from './recommendation-engine.service'
import { SmartNavigatorService } from './smart-navigator.service'
import { TrustService } from './trust/trust.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SmartSearchDto } from './dto/smart-search.dto'

@Controller('recommendation')
export class RecommendationController {
  constructor(
    private recommendationEngine: RecommendationEngineService,
    private smartNavigator: SmartNavigatorService,
    private trustService: TrustService
  ) {}

  /**
   * Умный навигатор - подбор лучшего варианта
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
   * Получение рекомендаций (альтернативный endpoint)
   */
  @Get('listings')
  async getRecommendations(
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

    return this.recommendationEngine.findRecommendations(params)
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
   * Отметка "мне подошло / не подошло"
   */
  @Post('recommendations/:id/feedback')
  @UseGuards(JwtAuthGuard)
  async markFeedback(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { feedback: 'liked' | 'disliked' },
    @Request() req: any
  ) {
    await this.smartNavigator.markRecommendationFeedback(id, body.feedback)
    return { success: true }
  }

  /**
   * Проверка доверия к хозяину
   */
  @Get('trust/owner/:ownerId')
  @UseGuards(JwtAuthGuard)
  async checkOwnerTrust(@Param('ownerId', new ParseUUIDPipe({ version: '4' })) ownerId: string) {
    return this.trustService.checkOwnerTrust(ownerId)
  }
}
