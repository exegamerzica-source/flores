import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  let settings = null
  let products: any[] = []

  try {
    settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    products = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  } catch (err) {
    console.error('Database connection error in /api/home:', err)
  }

  const htmlPath = path.join(process.cwd(), 'public', 'template.html')
  let html = ''
  try {
    html = fs.readFileSync(htmlPath, 'utf8')
  } catch(e) {
    return new NextResponse("Template not found", { status: 500 })
  }

  // Parse phone number safely
  const rawPhone = settings?.whatsapp || '5554981311242'
  const cleanDigits = rawPhone.replace(/\D/g, '')
  
  let fullWith55 = cleanDigits
  let without55 = cleanDigits
  if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    fullWith55 = cleanDigits
    without55 = cleanDigits.slice(2)
  } else {
    fullWith55 = '55' + cleanDigits
    without55 = cleanDigits
  }

  // 1. Replace JavaScript constant WPP_PHONE
  html = html.replace(
    /const WPP_PHONE = '.*?';/,
    `const WPP_PHONE = '${without55}';`
  )

  // 2. Replace all WhatsApp URLs with phone parameter
  html = html.replace(
    /phone=\+?55\d{10,11}/g,
    `phone=+${fullWith55}`
  )
  html = html.replace(
    /phone=\d{10,11}/g,
    `phone=+${fullWith55}`
  )

  // 3. Replace any legacy numbers
  html = html.replace(/54981311242/g, without55)
  html = html.replace(/47999\d{6}/g, without55)

  // 4. Update products array if products exist in DB
  if (products && products.length > 0) {
    const productsJson = JSON.stringify(products)
    html = html.replace(
      /allProducts\s*=\s*\[[\s\S]*?\];/,
      `allProducts = ${productsJson};`
    )
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  })
}
