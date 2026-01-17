import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ListingsService } from './listings.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { SearchListingsDto } from './dto/search-listings.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createListingDto: CreateListingDto, @Request() req) {
    return this.listingsService.create(createListingDto, req.user.id)
  }

  @Get()
  findAll(@Query() searchDto: SearchListingsDto) {
    if (Object.keys(searchDto).length > 0) {
      return this.listingsService.search(searchDto)
    }
    return this.listingsService.findAll()
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyListings(@Request() req) {
    return this.listingsService.findByOwner(req.user.id)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id)
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  duplicate(@Param('id') id: string, @Request() req) {
    return this.listingsService.duplicate(id, req.user.id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id)
  }
}