import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { City } from './entities/city.entity'

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>
  ) {}

  /**
   * Поиск городов по названию (автодополнение)
   */
  async searchCities(query: string, limit: number = 10): Promise<City[]> {
    if (!query || query.length < 2) {
      return []
    }

    return this.citiesRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { region: Like(`%${query}%`) },
      ],
      order: {
        listingsCount: 'DESC',
        name: 'ASC',
      },
      take: limit,
    })
  }

  /**
   * Получить город по координатам (reverse geocoding)
   */
  async getCityByCoordinates(lat: number, lng: number): Promise<City | null> {
    // Простой поиск ближайшего города (в production использовать PostGIS)
    const cities = await this.citiesRepository.find({
      order: {
        listingsCount: 'DESC',
      },
      take: 100,
    })

    let closestCity: City | null = null
    let minDistance = Infinity

    for (const city of cities) {
      const distance = this.calculateDistance(
        lat,
        lng,
        parseFloat(city.latitude.toString()),
        parseFloat(city.longitude.toString())
      )

      if (distance < minDistance && distance < 50) { // В радиусе 50 км
        minDistance = distance
        closestCity = city
      }
    }

    return closestCity
  }

  /**
   * Создать или обновить город
   */
  async createOrUpdate(cityData: Partial<City>): Promise<City> {
    let city = await this.citiesRepository.findOne({
      where: {
        name: cityData.name,
        country: cityData.country || 'RU',
      },
    })

    if (city) {
      Object.assign(city, cityData)
      return this.citiesRepository.save(city)
    }

    city = this.citiesRepository.create(cityData)
    return this.citiesRepository.save(city)
  }

  /**
   * Увеличить счетчик объявлений
   */
  async incrementListingsCount(cityName: string): Promise<void> {
    const city = await this.citiesRepository.findOne({
      where: { name: cityName },
    })

    if (city) {
      city.listingsCount += 1
      await this.citiesRepository.save(city)
    }
  }

  /**
   * Вычисление расстояния между двумя точками (формула гаверсинуса)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Радиус Земли в км
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Инициализация популярных городов России (100+ городов)
   */
  async initializePopularCities(): Promise<void> {
    const { RUSSIAN_CITIES } = await import('./data/russian-cities')

    for (const cityData of RUSSIAN_CITIES) {
      await this.createOrUpdate({
        ...cityData,
        country: 'RU',
      })
    }
  }
}
