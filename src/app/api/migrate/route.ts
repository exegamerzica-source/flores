import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Create tables with raw SQL if not exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" TEXT PRIMARY KEY DEFAULT 'global',
        "whatsapp" TEXT NOT NULL DEFAULT '5554981311242',
        "contactEmail" TEXT NOT NULL DEFAULT 'contato@pracadasflowers.shop',
        "storeName" TEXT NOT NULL DEFAULT 'Praça das Flowers'
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id SERIAL PRIMARY KEY",
        "id" INTEGER PRIMARY KEY,
        "title" TEXT NOT NULL,
        "price" TEXT NOT NULL,
        "image" TEXT NOT NULL,
        "raw_image" TEXT NOT NULL,
        "description" TEXT,
        "categoryId" TEXT
      );
    `).catch(async () => {
      // Fallback create table if serial syntax issue
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Product" (
          "id" INT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "price" TEXT NOT NULL,
          "image" TEXT NOT NULL,
          "raw_image" TEXT NOT NULL,
          "description" TEXT,
          "categoryId" TEXT
        );
      `)
    })

    // Upsert default settings
    await prisma.settings.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        whatsapp: '5554981311242',
        storeName: 'Praça das Flowers'
      }
    })

    // Seed products if empty
    const count = await prisma.product.count()
    let seeded = 0
    if (count === 0) {
      const p = path.join(process.cwd(), 'products_extract.json')
      if (fs.existsSync(p)) {
        const products = JSON.parse(fs.readFileSync(p, 'utf8'))
        for (const item of products) {
          await prisma.product.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              price: item.price,
              image: item.image || '',
              raw_image: item.raw_image || '',
              description: item.description || ''
            },
            create: {
              id: item.id,
              title: item.title,
              price: item.price,
              image: item.image || '',
              raw_image: item.raw_image || '',
              description: item.description || ''
            }
          })
          seeded++
        }
      }
    }

    return NextResponse.json({ success: true, count, seeded, message: 'Database migrated successfully!' })
  } catch (e: any) {
    console.error('Migration error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
