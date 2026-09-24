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

function saveData(data: { settings: Record<string, string>; products: any[] }) {
  const p = path.join('/tmp', 'data.json')
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

export async function POST(request: Request) {
  const body = await request.json()
  const data = getData()
  data.settings = { ...data.settings, ...body }
  saveData(data)
  return NextResponse.json({ success: true, settings: data.settings })
}
