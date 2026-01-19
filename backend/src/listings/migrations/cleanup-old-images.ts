/**
 * Миграция для очистки старых data:image из БД.
 * 
 * Запуск:
 * npm run typeorm migration:run
 * 
 * Или вручную через SQL:
 * UPDATE listings SET images = '{}' WHERE images IS NULL OR images::text LIKE '%data:image%';
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class CleanupOldImages1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Очищаем images, которые содержат data:image или являются null
    await queryRunner.query(`
      UPDATE listings
      SET images = '{}'
      WHERE images IS NULL
         OR images::text LIKE '%data:image%'
         OR images::text = ''
         OR images::text = 'null';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат миграции не требуется (нельзя восстановить удалённые данные)
  }
}
