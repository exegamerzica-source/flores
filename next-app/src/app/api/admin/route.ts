import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json({
    settings: settings || { whatsapp: '5554981311242', storeName: 'Praça das Flowers' },
    products
  })
}
