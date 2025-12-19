import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client')
  return new PrismaClient()
}

// GET all categories
export async function GET() {
  const prisma = await getPrisma()
  
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(categories)
    
  } catch (error: any) {
    console.error(' GET Categories Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST create new category (Admin only)
export async function POST(request: Request) {
  const prisma = await getPrisma()
  
  try {
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }
    
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { name: body.name }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }
    
    const category = await prisma.category.create({
      data: {
        name: body.name,
        description: body.description || '',
        isActive: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category
    }, { status: 201 })
    
  } catch (error: any) {
    console.error(' POST Category Error:', error)
    return NextResponse.json(
      { error: 'Failed to create category: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}