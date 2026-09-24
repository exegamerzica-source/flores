import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function getData() {
  const p = path.join('/tmp', 'data.json')
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  return {
    settings: { whatsapp: '5554981311242', storeName: 'Praça das Flowers' },
    products: []
  }
}

export async function GET() {
  const data = getData()

  const htmlPath = path.join(process.cwd(), 'public', 'template.html')
  let html = ''
  try {
    html = fs.readFileSync(htmlPath, 'utf8')
  } catch(e) {
    return new NextResponse("Template not found", { status: 500 })
  }

  const phone = data.settings.whatsapp
  
  html = html.replace(
    /const WPP_PHONE = '.*?';/,
    `const WPP_PHONE = '${phone}';`
  )
  
  html = html.replace(
    /phone=\+?55\d{10,11}/g,
    `phone=+${phone}`
  )

  if (data.products && data.products.length > 0) {
    const productsJson = JSON.stringify(data.products)
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
