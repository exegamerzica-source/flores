const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const p = path.join(__dirname, '..', 'products_extract.json')
  const products = JSON.parse(fs.readFileSync(p, 'utf8'))
  
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      whatsapp: '5554981311242',
      storeName: 'Praça das Flowers'
    }
  })

  let count = 0
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        price: p.price,
        image: p.image || '',
        raw_image: p.raw_image || '',
        description: p.description || ''
      },
      create: {
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.image || '',
        raw_image: p.raw_image || '',
        description: p.description || ''
      }
    })
    count++
  }
  
  console.log(`Seeded ${count} products successfully!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
