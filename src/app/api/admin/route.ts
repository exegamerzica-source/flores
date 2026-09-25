import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')
  if (token !== 'gabyflores2026') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json({
    settings: settings || { whatsapp: '5554981311242', storeName: 'Praça das Flowers' },
    products
  })
}
