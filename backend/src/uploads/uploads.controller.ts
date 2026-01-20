import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UploadsService, type UploadedFile } from './uploads.service'

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload listing images.
   * - Accepts multipart/form-data (files[])
   * - Converts/normalizes and stores file
   * - Returns URL-only: { images: string[] }
   */
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: {
        files: 10,
        fileSize: 15 * 1024 * 1024, // 15MB per file
      },
    })
  )
  async uploadImages(
    @UploadedFiles() files: UploadedFile[],
    @Req() req: Request
  ): Promise<{ images: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не переданы')
    }

    const saved = await this.uploadsService.saveListingImages({
      files,
      userId: (req as Request & { user: { id: string } }).user.id,
    })

    const proto = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const origin = `${proto}://${host}`

    return {
      images: saved.map((s) => `${origin}${s.relativePath}`),
    }
  }
}

