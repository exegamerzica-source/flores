import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')
  if (token !== 'gabyflores2026') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const data = await request.json()
  
  const updated = await prisma.settings.upsert({
    where: { id: 'global' },
    update: {
      whatsapp: data.whatsapp,
      storeName: data.storeName
    },
    create: {
      id: 'global',
      whatsapp: data.whatsapp || '5554981311242',
      storeName: data.storeName || 'Praça das Flowers'
    }
  })
  
  return NextResponse.json({ success: true, settings: updated })
}
