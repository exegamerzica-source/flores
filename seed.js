const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function main() {
  // Read products from json
  const products = JSON.parse(fs.readFileSync('../products_extract.json', 'utf8'))
  
  // Create settings
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      whatsapp: '5554981311242',
      storeName: 'Praça das Flowers'
    }
  })

  // Insert products
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
  }
  
  console.log('Seeded database successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
