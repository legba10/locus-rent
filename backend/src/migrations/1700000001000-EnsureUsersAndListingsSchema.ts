import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Миграция, которая системно приводит таблицы users и listings
 * к минимально необходимой схеме согласно текущим TypeORM entities.
 *
 * ВАЖНО:
 * - Используются IF EXISTS / IF NOT EXISTS, чтобы миграция была идемпотентной
 *   и не падала, если часть колонок уже создана.
 * - Типы колонок подобраны под актуальные entities, но без жёстких
 *   ограничений по enum/constraint — это снижает риск конфликтов
 *   с уже существующей схемой в проде.
 */
export class EnsureUsersAndListingsSchema1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // UUID generation support (used by DEFAULT gen_random_uuid()).
    // Safe to run multiple times.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)

    // Create base tables if they don't exist yet (safe, non-destructive).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid()
      );
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid()
      );
    `)

    // USERS
    await queryRunner.query(`
      ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS email varchar,
        ADD COLUMN IF NOT EXISTS phone varchar,
        ADD COLUMN IF NOT EXISTS password varchar,
        ADD COLUMN IF NOT EXISTS "firstName" varchar NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "lastName" varchar,
        ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS "telegramId" varchar,
        ADD COLUMN IF NOT EXISTS avatar varchar,
        ADD COLUMN IF NOT EXISTS documents jsonb,
        ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "phoneVerified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS city varchar,
        ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
        ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
        ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();
    `)

    // LISTINGS
    await queryRunner.query(`
      ALTER TABLE IF EXISTS listings
        ADD COLUMN IF NOT EXISTS title varchar NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS images text,
        ADD COLUMN IF NOT EXISTS type varchar,
        ADD COLUMN IF NOT EXISTS city varchar,
        ADD COLUMN IF NOT EXISTS district varchar,
        ADD COLUMN IF NOT EXISTS address varchar,
        ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
        ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
        ADD COLUMN IF NOT EXISTS "pricePerNight" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "pricePerWeek" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "pricePerMonth" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "maxGuests" integer,
        ADD COLUMN IF NOT EXISTS bedrooms integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS beds integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS bathrooms integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS amenities text,
        ADD COLUMN IF NOT EXISTS availability jsonb,
        ADD COLUMN IF NOT EXISTS "houseRules" text,
        ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS "revisionReason" text,
        ADD COLUMN IF NOT EXISTS rating numeric(3,2),
        ADD COLUMN IF NOT EXISTS "reviewsCount" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "ownerId" uuid,
        ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();
    `)
  }

  // Откат намеренно оставлен пустым: удаление колонок в проде может привести
  // к потере данных. При необходимости можно добавить ручной down-скрипт.
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}

