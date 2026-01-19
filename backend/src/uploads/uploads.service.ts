import { BadRequestException, Injectable, UnsupportedMediaTypeException } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

export type SavedImage = {
  relativePath: string // e.g. /uploads/listings/<userId>/<file>.webp
}

@Injectable()
export class UploadsService {
  private readonly maxWidth = 2048
  private readonly maxHeight = 2048

  async saveListingImages(params: {
    files: Express.Multer.File[]
    userId: string
  }): Promise<SavedImage[]> {
    const { files, userId } = params

    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не переданы')
    }

    const outDir = path.join(process.cwd(), 'uploads', 'listings', userId)
    await fs.promises.mkdir(outDir, { recursive: true })

    const results: SavedImage[] = []

    for (const file of files) {
      // Basic mimetype sanity check (we still rely on sharp for actual decoding)
      const mime = String(file.mimetype || '')
      const isImage =
        mime.startsWith('image/') ||
        mime === 'application/octet-stream' // some mobile browsers send octet-stream

      if (!isImage) {
        throw new UnsupportedMediaTypeException('Загружайте только изображения')
      }

      let pipeline = sharp(file.buffer, { failOnError: true })

      // Normalize orientation (EXIF), color profile, etc.
      pipeline = pipeline.rotate()

      // Resize (keep aspect ratio)
      pipeline = pipeline.resize({
        width: this.maxWidth,
        height: this.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })

      // Convert to webp (stable on the web; frontend never needs to know original format)
      pipeline = pipeline.webp({ quality: 82 })

      const filename = `${crypto.randomUUID()}.webp`
      const outPath = path.join(outDir, filename)

      try {
        await pipeline.toFile(outPath)
      } catch (e) {
        throw new UnsupportedMediaTypeException(
          'Формат изображения не поддерживается или файл повреждён'
        )
      }

      results.push({
        relativePath: `/uploads/listings/${userId}/${filename}`,
      })
    }

    return results
  }
}

