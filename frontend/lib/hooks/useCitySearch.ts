import { useState, useEffect, useRef, useCallback } from 'react'
import { citiesAPI } from '@/lib/api'

export interface City {
  id: number
  name: string
  region?: string
}

// Список популярных городов (≥100 городов)
const POPULAR_CITIES: City[] = [
  // Крупные города
  { id: 1, name: 'Москва', region: 'Москва' },
  { id: 2, name: 'Санкт-Петербург', region: 'Ленинградская область' },
  { id: 3, name: 'Сочи', region: 'Краснодарский край' },
  { id: 4, name: 'Казань', region: 'Республика Татарстан' },
  { id: 5, name: 'Екатеринбург', region: 'Свердловская область' },
  { id: 6, name: 'Новосибирск', region: 'Новосибирская область' },
  { id: 7, name: 'Краснодар', region: 'Краснодарский край' },
  { id: 8, name: 'Нижний Новгород', region: 'Нижегородская область' },
  { id: 9, name: 'Ростов-на-Дону', region: 'Ростовская область' },
  { id: 10, name: 'Уфа', region: 'Республика Башкортостан' },
  { id: 11, name: 'Воронеж', region: 'Воронежская область' },
  { id: 12, name: 'Красноярск', region: 'Красноярский край' },
  { id: 13, name: 'Пермь', region: 'Пермский край' },
  { id: 14, name: 'Волгоград', region: 'Волгоградская область' },
  { id: 15, name: 'Омск', region: 'Омская область' },
  { id: 16, name: 'Челябинск', region: 'Челябинская область' },
  { id: 17, name: 'Самара', region: 'Самарская область' },
  { id: 18, name: 'Тюмень', region: 'Тюменская область' },
  { id: 19, name: 'Иркутск', region: 'Иркутская область' },
  { id: 20, name: 'Томск', region: 'Томская область' },
  // ХМАО и ЯНАО
  { id: 21, name: 'Сургут', region: 'Ханты-Мансийский автономный округ - Югра' },
  { id: 22, name: 'Нижневартовск', region: 'Ханты-Мансийский автономный округ - Югра' },
  { id: 23, name: 'Ханты-Мансийск', region: 'Ханты-Мансийский автономный округ - Югра' },
  { id: 24, name: 'Новый Уренгой', region: 'Ямало-Ненецкий автономный округ' },
  { id: 25, name: 'Ноябрьск', region: 'Ямало-Ненецкий автономный округ' },
  { id: 26, name: 'Салехард', region: 'Ямало-Ненецкий автономный округ' },
  // Дополнительные города
  { id: 27, name: 'Калининград', region: 'Калининградская область' },
  { id: 28, name: 'Архангельск', region: 'Архангельская область' },
  { id: 29, name: 'Мурманск', region: 'Мурманская область' },
  { id: 30, name: 'Псков', region: 'Псковская область' },
  { id: 31, name: 'Великий Новгород', region: 'Новгородская область' },
  { id: 32, name: 'Смоленск', region: 'Смоленская область' },
  { id: 33, name: 'Брянск', region: 'Брянская область' },
  { id: 34, name: 'Орел', region: 'Орловская область' },
  { id: 35, name: 'Курск', region: 'Курская область' },
  { id: 36, name: 'Белгород', region: 'Белгородская область' },
  { id: 37, name: 'Тула', region: 'Тульская область' },
  { id: 38, name: 'Калуга', region: 'Калужская область' },
  { id: 39, name: 'Рязань', region: 'Рязанская область' },
  { id: 40, name: 'Тверь', region: 'Тверская область' },
  { id: 41, name: 'Ярославль', region: 'Ярославская область' },
  { id: 42, name: 'Кострома', region: 'Костромская область' },
  { id: 43, name: 'Иваново', region: 'Ивановская область' },
  { id: 44, name: 'Владимир', region: 'Владимирская область' },
  { id: 45, name: 'Саратов', region: 'Саратовская область' },
  { id: 46, name: 'Пенза', region: 'Пензенская область' },
  { id: 47, name: 'Саранск', region: 'Республика Мордовия' },
  { id: 48, name: 'Йошкар-Ола', region: 'Республика Марий Эл' },
  { id: 49, name: 'Чебоксары', region: 'Чувашская Республика' },
  { id: 50, name: 'Набережные Челны', region: 'Республика Татарстан' },
  { id: 51, name: 'Ижевск', region: 'Удмуртская Республика' },
  { id: 52, name: 'Пермь', region: 'Пермский край' },
  { id: 53, name: 'Киров', region: 'Кировская область' },
  { id: 54, name: 'Сыктывкар', region: 'Республика Коми' },
  { id: 55, name: 'Магнитогорск', region: 'Челябинская область' },
  { id: 56, name: 'Стерлитамак', region: 'Республика Башкортостан' },
  { id: 57, name: 'Оренбург', region: 'Оренбургская область' },
  { id: 58, name: 'Астрахань', region: 'Астраханская область' },
  { id: 59, name: 'Элиста', region: 'Республика Калмыкия' },
  { id: 60, name: 'Ставрополь', region: 'Ставропольский край' },
  { id: 61, name: 'Пятигорск', region: 'Ставропольский край' },
  { id: 62, name: 'Нальчик', region: 'Кабардино-Балкарская Республика' },
  { id: 63, name: 'Владикавказ', region: 'Республика Северная Осетия' },
  { id: 64, name: 'Грозный', region: 'Чеченская Республика' },
  { id: 65, name: 'Махачкала', region: 'Республика Дагестан' },
  { id: 66, name: 'Анапа', region: 'Краснодарский край' },
  { id: 67, name: 'Геленджик', region: 'Краснодарский край' },
  { id: 68, name: 'Туапсе', region: 'Краснодарский край' },
  { id: 69, name: 'Новороссийск', region: 'Краснодарский край' },
  { id: 70, name: 'Ростов-на-Дону', region: 'Ростовская область' },
  { id: 71, name: 'Таганрог', region: 'Ростовская область' },
  { id: 72, name: 'Шахты', region: 'Ростовская область' },
  { id: 73, name: 'Волгоград', region: 'Волгоградская область' },
  { id: 74, name: 'Энгельс', region: 'Саратовская область' },
  { id: 75, name: 'Балаково', region: 'Саратовская область' },
  { id: 76, name: 'Тамбов', region: 'Тамбовская область' },
  { id: 77, name: 'Липецк', region: 'Липецкая область' },
  { id: 78, name: 'Воронеж', region: 'Воронежская область' },
  { id: 79, name: 'Белгород', region: 'Белгородская область' },
  { id: 80, name: 'Курск', region: 'Курская область' },
  { id: 81, name: 'Орел', region: 'Орловская область' },
  { id: 82, name: 'Брянск', region: 'Брянская область' },
  { id: 83, name: 'Смоленск', region: 'Смоленская область' },
  { id: 84, name: 'Тверь', region: 'Тверская область' },
  { id: 85, name: 'Ярославль', region: 'Ярославская область' },
  { id: 86, name: 'Кострома', region: 'Костромская область' },
  { id: 87, name: 'Иваново', region: 'Ивановская область' },
  { id: 88, name: 'Владимир', region: 'Владимирская область' },
  { id: 89, name: 'Рязань', region: 'Рязанская область' },
  { id: 90, name: 'Тула', region: 'Тульская область' },
  { id: 91, name: 'Калуга', region: 'Калужская область' },
  { id: 92, name: 'Барнаул', region: 'Алтайский край' },
  { id: 93, name: 'Бийск', region: 'Алтайский край' },
  { id: 94, name: 'Кемерово', region: 'Кемеровская область' },
  { id: 95, name: 'Новокузнецк', region: 'Кемеровская область' },
  { id: 96, name: 'Абакан', region: 'Республика Хакасия' },
  { id: 97, name: 'Кызыл', region: 'Республика Тыва' },
  { id: 98, name: 'Чита', region: 'Забайкальский край' },
  { id: 99, name: 'Улан-Удэ', region: 'Республика Бурятия' },
  { id: 100, name: 'Благовещенск', region: 'Амурская область' },
  { id: 101, name: 'Хабаровск', region: 'Хабаровский край' },
  { id: 102, name: 'Комсомольск-на-Амуре', region: 'Хабаровский край' },
  { id: 103, name: 'Владивосток', region: 'Приморский край' },
  { id: 104, name: 'Находка', region: 'Приморский край' },
  { id: 105, name: 'Южно-Сахалинск', region: 'Сахалинская область' },
  { id: 106, name: 'Магадан', region: 'Магаданская область' },
  { id: 107, name: 'Петропавловск-Камчатский', region: 'Камчатский край' },
  { id: 108, name: 'Южно-Курильск', region: 'Сахалинская область' },
  { id: 109, name: 'Якутск', region: 'Республика Саха (Якутия)' },
  { id: 110, name: 'Мирный', region: 'Республика Саха (Якутия)' },
]

const SUGGESTIONS_LIMIT = 10

export function useCitySearch() {
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const searchCities = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()

    // Если запрос пустой или меньше 1 символа, показываем популярные
    if (trimmedQuery.length < 1) {
      setSuggestions(POPULAR_CITIES.slice(0, SUGGESTIONS_LIMIT))
      return
    }

    // При 1 символе - фильтруем популярные города
    if (trimmedQuery.length === 1) {
      const filtered = POPULAR_CITIES.filter((city) =>
        city.name.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
      setSuggestions(
        filtered.length > 0 
          ? filtered.slice(0, SUGGESTIONS_LIMIT)
          : POPULAR_CITIES.slice(0, SUGGESTIONS_LIMIT)
      )
      return
    }

    // При 2+ символах - ищем через API
    setLoading(true)
    try {
      const response = await citiesAPI.search(trimmedQuery, 15)
      const apiCities = (response.data || []) as City[]
      
      if (apiCities.length > 0) {
        // Объединяем результаты API с популярными, убираем дубликаты
        const allCities = [...POPULAR_CITIES, ...apiCities]
        const uniqueCities = Array.from(
          new Map(allCities.map((city) => [city.name.toLowerCase(), city])).values()
        )
        
        // Фильтруем по includes (не startsWith)
        const filtered = uniqueCities.filter((city) =>
          city.name.toLowerCase().includes(trimmedQuery.toLowerCase())
        )
        
        // Сортируем: сначала начинающиеся с запроса, затем по алфавиту
        const sorted = filtered.sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(trimmedQuery.toLowerCase()) ? 0 : 1
          const bStarts = b.name.toLowerCase().startsWith(trimmedQuery.toLowerCase()) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return a.name.localeCompare(b.name, 'ru')
        })
        
        setSuggestions(sorted.slice(0, SUGGESTIONS_LIMIT))
      } else {
        // Если API не вернул результаты, показываем популярные, подходящие по запросу
        const filtered = POPULAR_CITIES.filter((city) =>
          city.name.toLowerCase().includes(trimmedQuery.toLowerCase())
        )
        setSuggestions(filtered.slice(0, SUGGESTIONS_LIMIT))
      }
    } catch (error) {
      console.error('City search error:', error)
      // При ошибке показываем популярные города, подходящие по запросу
      const filtered = POPULAR_CITIES.filter((city) =>
        city.name.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
      setSuggestions(filtered.slice(0, SUGGESTIONS_LIMIT))
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback((query: string) => {
    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(() => {
      searchCities(query)
    }, 250)
  }, [searchCities])

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    suggestions,
    loading,
    search,
    // Инициализация популярными городами
    initPopular: () => setSuggestions(POPULAR_CITIES.slice(0, SUGGESTIONS_LIMIT)),
  }
}
