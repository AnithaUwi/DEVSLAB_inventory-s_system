import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(' Seeding database...')

  // Default categories for spare parts
  const categories = [
    { name: 'Engine', description: 'Engine components and parts' },
    { name: 'Brake', description: 'Brake system parts' },
    { name: 'Body', description: 'Body and exterior parts' },
    { name: 'Electrical', description: 'Electrical and lighting parts' },
    { name: 'Suspension', description: 'Suspension and steering parts' },
    { name: 'Transmission', description: 'Transmission and gearbox parts' },
    { name: 'Fuel System', description: 'Fuel system components' },
    { name: 'Cooling System', description: 'Cooling and radiator parts' },
    { name: 'Exhaust', description: 'Exhaust system parts' },
    { name: 'Accessories', description: 'Miscellaneous accessories' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
    console.log(` Added category: ${category.name}`)
  }

  console.log(' Seeding completed!')
}

main()
  .catch((e) => {
    console.error(' Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })