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
  return NextResponse.json(getData())
}
