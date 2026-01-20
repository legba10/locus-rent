import { Controller, Get, UseGuards, Param, Patch, Body, ParseUUIDPipe } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { Roles } from './decorators/roles.decorator'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats()
  }

  @Get('listings/moderation')
  getListingsForModeration() {
    return this.adminService.getListingsForModeration()
  }

  @Patch('listings/:id/moderate')
  moderateListing(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { status: string; revisionReason?: string }
  ) {
    return this.adminService.moderateListing(id, body.status, body.revisionReason)
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers()
  }

  @Patch('users/:id/block')
  blockUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.blockUser(id)
  }

  @Patch('users/promote')
  promoteToAdmin(@Body() body: { emailOrPhone: string }) {
    return this.adminService.promoteToAdmin(body.emailOrPhone)
  }
}
