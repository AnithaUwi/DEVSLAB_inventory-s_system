import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/Auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const branchIdFilter = session?.user?.branchId || undefined

    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        stockBalances: branchIdFilter 
          ? { where: { branchId: branchIdFilter } }
          : true
      },
      orderBy: { code: 'asc' }
    })
    
    // Calculate total quantity for each item
    const itemsWithStock = items.map(item => {
      const totalQuantity = item.stockBalances.reduce((sum, bal) => sum + bal.quantity, 0)
      const branchQuantity = branchIdFilter 
        ? item.stockBalances.find(b => b.branchId === branchIdFilter)?.quantity || 0
        : totalQuantity
      
      return {
        ...item,
        stockQuantity: branchIdFilter ? branchQuantity : totalQuantity,
        stockBalances: item.stockBalances.map(bal => ({
          branchId: bal.branchId,
          quantity: bal.quantity,
          updatedAt: bal.updatedAt
        }))
      }
    })
    
    return NextResponse.json(itemsWithStock)
  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Get last item code
    const lastItem = await prisma.item.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true }
    })
    
    let nextCode = 'ITM-001'
    if (lastItem?.code) {
      const match = lastItem.code.match(/ITM-(\d+)/)
      if (match) {
        const num = parseInt(match[1]) + 1
        nextCode = `ITM-${num.toString().padStart(3, '0')}`
      }
    }
    
    // Create item
    const item = await prisma.item.create({
      data: {
        code: nextCode,
        name: body.name,
        description: body.description || '',
        category: body.category || 'Uncategorized',
        unitOfMeasure: body.unitOfMeasure || 'pcs',
        reorderLevel: body.reorderLevel || 10,
        currentPrice: body.currentPrice || 0,
        isActive: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Item created',
      item
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create item: ' + error.message },
      { status: 500 }
    )
  }
}