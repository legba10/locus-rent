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
import { SupportService } from './support.service'
import { CreateSupportMessageDto } from './dto/create-support-message.dto'
import { UpdateSupportMessageDto } from './dto/update-support-message.dto'
import { SupportMessageStatus } from './entities/support-message.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../admin/guards/roles.guard'
import { Roles } from '../admin/decorators/roles.decorator'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@Body() createDto: CreateSupportMessageDto, @Request() req) {
    const userId = req.user?.id
    return this.supportService.create(createDto, userId)
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('status') status?: SupportMessageStatus) {
    return this.supportService.findAll(status)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateDto: UpdateSupportMessageDto) {
    return this.supportService.update(id, updateDto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.supportService.remove(id)
  }
}
