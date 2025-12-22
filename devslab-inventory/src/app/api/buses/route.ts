import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/Auth'

// GET all buses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // Branch-scoped users can only see their branch's buses
    const userBranchId = session.user.branchId
    const isGlobalRole = ['ADMIN', 'HQ_MANAGER', 'AUDITOR'].includes(session.user.role)

    let whereClause: any = { isActive: true }
    
    if (!isGlobalRole && userBranchId) {
      whereClause.branchId = userBranchId
    } else if (branchId) {
      whereClause.branchId = branchId
    }

    const buses = await prisma.bus.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        stockMovements: {
          where: { type: 'ISSUE' },
          select: {
            id: true,
            quantity: true,
            createdAt: true,
            item: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { plateNumber: 'asc' }
    })

    // Calculate consumption stats for each bus
    const busesWithStats = buses.map(bus => {
      const totalIssues = bus.stockMovements.length
      const totalQuantity = bus.stockMovements.reduce((sum, m) => sum + m.quantity, 0)
      
      return {
        id: bus.id,
        plateNumber: bus.plateNumber,
        fleetNumber: bus.fleetNumber,
        branch: bus.branch,
        make: bus.make,
        model: bus.model,
        year: bus.year,
        isActive: bus.isActive,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
        stats: {
          totalIssues,
          totalQuantity,
          lastIssue: bus.stockMovements[0]?.createdAt || null
        },
        recentMovements: bus.stockMovements
      }
    })

    return NextResponse.json(busesWithStats)
  } catch (error: any) {
    console.error('Error fetching buses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    )
  }
}

// POST create new bus
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and managers can create buses
    if (!['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.plateNumber || !body.branchId) {
      return NextResponse.json(
        { error: 'Plate number and branch are required' },
        { status: 400 }
      )
    }

    // Check if plate number already exists
    const existing = await prisma.bus.findUnique({
      where: { plateNumber: body.plateNumber }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Bus with this plate number already exists' },
        { status: 400 }
      )
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId }
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Branch managers can only create buses for their branch
    if (session.user.role === 'BRANCH_MANAGER' && session.user.branchId !== body.branchId) {
      return NextResponse.json(
        { error: 'You can only create buses for your branch' },
        { status: 403 }
      )
    }

    const bus = await prisma.bus.create({
      data: {
        plateNumber: body.plateNumber,
        fleetNumber: body.fleetNumber || null,
        branchId: body.branchId,
        make: body.make || null,
        model: body.model || null,
        year: body.year || null,
        isActive: true
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Bus created successfully',
      bus
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bus:', error)
    return NextResponse.json(
      { error: 'Failed to create bus: ' + error.message },
      { status: 500 }
    )
  }
}




