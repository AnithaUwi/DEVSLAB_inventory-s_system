import { NextRequest, NextResponse } from 'next/server'
import { MovementType, UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/Auth'

const BRANCH_SCOPED_ROLES: UserRole[] = ['BRANCH_MANAGER', 'STOREKEEPER', 'MECHANIC']
const GLOBAL_ROLES: UserRole[] = ['ADMIN', 'HQ_MANAGER', 'AUDITOR']

// GET all stock movements with role-aware filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedBranchId = searchParams.get('branchId')
    const userRole = session.user.role
    const userBranchId = session.user.branchId

    // Branch-limited roles can only see their branch (including transfers touching it)
    let whereClause: any = {}
    if (BRANCH_SCOPED_ROLES.includes(userRole)) {
      if (!userBranchId) {
        return NextResponse.json(
          { error: 'User does not belong to a branch' },
          { status: 400 }
        )
      }
      whereClause = {
        OR: [
          { branchId: userBranchId },
          { fromBranchId: userBranchId },
          { toBranchId: userBranchId }
        ]
      }
    } else if (requestedBranchId) {
      whereClause = {
        OR: [
          { branchId: requestedBranchId },
          { fromBranchId: requestedBranchId },
          { toBranchId: requestedBranchId }
        ]
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            code: true,
            name: true,
            unitOfMeasure: true
          }
        },
        branch: {
          select: {
            name: true,
            code: true
          }
        },
        fromBranch: { select: { name: true, code: true } },
        toBranch: { select: { name: true, code: true } },
        bus: { 
          select: { 
            id: true,
            plateNumber: true,
            fleetNumber: true
          } 
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 200 // keep recent but allow a bit more history
    })
    
    return NextResponse.json(movements)
    
  } catch (error: any) {
    console.error(' GET Stock Movements Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

// POST create new stock movement with balance adjustments
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log(' Creating stock movement:', {
      type: body.type,
      itemId: body.itemId,
      branchId: body.branchId,
      fromBranchId: body.fromBranchId,
      toBranchId: body.toBranchId,
      busId: body.busId,
      quantity: body.quantity,
      userId: session.user.id
    })
    
    // Basic validation
    if (!body.type || !body.itemId || !body.quantity) {
      return NextResponse.json(
        { error: 'Type, item and quantity are required' },
        { status: 400 }
      )
    }

    const movementType = body.type as MovementType
    const quantity = Number(body.quantity)

    if (!Object.values(MovementType).includes(movementType)) {
      return NextResponse.json(
        { error: 'Invalid movement type' },
        { status: 400 }
      )
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than zero' },
        { status: 400 }
      )
    }
    
    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: body.itemId }
    })
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }
    
    // Resolve branch context based on role
    const userRole = session.user.role
    const userBranchId = session.user.branchId
    const isGlobalRole = GLOBAL_ROLES.includes(userRole)

    let branchId: string | null = body.branchId || null
    if (movementType === 'TRANSFER') {
      if (!body.fromBranchId || !body.toBranchId) {
        return NextResponse.json(
          { error: 'From branch and to branch are required for transfers' },
          { status: 400 }
        )
      }
      branchId = body.toBranchId // record destination as primary branch for the movement
    }

    if (!isGlobalRole) {
      if (!userBranchId) {
        return NextResponse.json(
          { error: 'User is not assigned to a branch' },
          { status: 400 }
        )
      }

      // Lock branch-scoped users to their branch
      if (movementType === 'TRANSFER') {
        if (body.fromBranchId !== userBranchId) {
          return NextResponse.json(
            { error: 'You can only transfer out of your own branch' },
            { status: 403 }
          )
        }
      } else {
        branchId = userBranchId
      }
    }

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch is required' },
        { status: 400 }
      )
    }
    
    // Check if branch exists (destination for transfers, otherwise primary)
    const targetBranch = await prisma.branch.findUnique({
      where: { id: branchId }
    })
    
    if (!targetBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }
    
    // For transfers, validate source branch exists
    if (movementType === 'TRANSFER') {
      const sourceBranch = await prisma.branch.findUnique({
        where: { id: body.fromBranchId }
      })
      if (!sourceBranch) {
        return NextResponse.json(
          { error: 'Source branch not found' },
          { status: 404 }
        )
      }
    }

    // Validate user exists in database
    const userId = session.user.id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      )
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }
    
    const movement = await prisma.$transaction(async (tx) => {
      const ensureBalance = async (branch: string) => {
        return tx.stockBalance.upsert({
          where: { itemId_branchId: { itemId: body.itemId, branchId: branch } },
          update: {},
          create: { itemId: body.itemId, branchId: branch, quantity: 0 }
        })
      }

      const applyDelta = async (branch: string, delta: number) => {
        const balance = await ensureBalance(branch)
        const nextQty = balance.quantity + delta
        if (nextQty < 0) {
          throw new Error(`Insufficient stock at ${branch}`)
        }
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: { quantity: nextQty }
        })
        return nextQty
      }

      switch (movementType) {
        case 'RECEIVE':
        case 'RETURN':
          await applyDelta(branchId!, quantity)
          break
        case 'ISSUE':
        case 'DISPOSE':
          await applyDelta(branchId!, -quantity)
          break
        case 'ADJUST': {
          if (quantity < 0) {
            throw new Error('Adjusted quantity cannot be negative')
          }
          const balance = await ensureBalance(branchId!)
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { quantity }
          })
          break
        }
        case 'TRANSFER': {
          await applyDelta(body.fromBranchId, -quantity)
          await applyDelta(body.toBranchId, quantity)
          break
        }
        default:
          throw new Error('Unhandled movement type')
      }

      return tx.stockMovement.create({
        data: {
          type: movementType,
          itemId: body.itemId,
          branchId: branchId!,
          fromBranchId: body.fromBranchId || null,
          toBranchId: body.toBranchId || null,
          busId: body.busId || null,
          quantity,
          reference: body.reference || null,
          notes: body.notes || null,
          userId: userId
        },
        include: {
          item: { select: { code: true, name: true, unitOfMeasure: true } },
          branch: { select: { name: true, code: true } },
          fromBranch: { select: { name: true, code: true } },
          toBranch: { select: { name: true, code: true } },
          bus: { 
            select: { 
              id: true,
              plateNumber: true,
              fleetNumber: true
            } 
          },
          user: { select: { name: true, email: true } }
        }
      })
    })
    
    console.log(' Stock movement created:', movement)
    
    return NextResponse.json({
      success: true,
      message: 'Stock movement recorded successfully',
      movement
    }, { status: 201 })
    
  } catch (error: any) {
    console.error(' POST Stock Movement Error:', error)
    console.error(' Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    
    // Provide more specific error messages
    let errorMessage = 'Failed to record stock movement: ' + error.message
    if (error.code === 'P2003') {
      errorMessage = 'Foreign key constraint failed. Please ensure the item, branch, and user exist in the database.'
    } else if (error.code === 'P2002') {
      errorMessage = 'A record with this information already exists.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}