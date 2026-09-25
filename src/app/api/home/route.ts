import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } })

  const htmlPath = path.join(process.cwd(), 'public', 'template.html')
  let html = ''
  try {
    html = fs.readFileSync(htmlPath, 'utf8')
  } catch(e) {
    return new NextResponse("Template not found", { status: 500 })
  }

  const phone = settings?.whatsapp || '5554981311242'
  
  html = html.replace(
    /const WPP_PHONE = '.*?';/,
    `const WPP_PHONE = '${phone}';`
  )
  
  html = html.replace(
    /phone=\+?55\d{10,11}/g,
    `phone=+${phone}`
  )

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
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
