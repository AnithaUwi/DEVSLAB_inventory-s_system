import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// FIX: Add 'async' to params
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // FIXED: params is Promise
) {
  try {
    // FIX: Await the params
    const { id } = await params
    console.log(' API GET - Item ID:', id)
    
    if (!id) {
      console.log('API - No ID provided')
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    const item = await prisma.item.findUnique({
      where: { id: id },
      include: {
        stockBalances: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })
    
    if (!item) {
      console.log('❌ API - Item not found')
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    // Calculate total quantity
    const totalQuantity = item.stockBalances.reduce((sum, bal) => sum + bal.quantity, 0)
    
    const itemWithStock = {
      ...item,
      totalStockQuantity: totalQuantity,
      stockBalances: item.stockBalances.map(bal => ({
        id: bal.id,
        branchId: bal.branchId,
        branch: bal.branch,
        quantity: bal.quantity,
        updatedAt: bal.updatedAt
      }))
    }
    
    console.log('API - Item found:', item.name, 'Total stock:', totalQuantity)
    return NextResponse.json(itemWithStock)
    
  } catch (error: any) {
    console.error(' API Error:', error)
    return NextResponse.json(
      { error: 'Failed: ' + error.message },
      { status: 500 }
    )
  }
}

// FIX: Same for PUT
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // FIXED
) {
  try {
    // FIX: Await the params
    const { id } = await params
    const body = await request.json()
    
    const item = await prisma.item.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description || '',
        category: body.category,
        unitOfMeasure: body.unitOfMeasure || 'pcs',
        reorderLevel: body.reorderLevel || 10,
        currentPrice: body.currentPrice || 0,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Updated',
      item
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed: ' + error.message },
      { status: 500 }
    )
  }
}

// FIX: Same for DELETE
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // FIXED
) {
  try {
    // FIX: Await the params
    const { id } = await params
    
    await prisma.item.update({
      where: { id: id },
      data: { isActive: false }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Deleted'
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed: ' + error.message },
      { status: 500 }
    )
  }
}