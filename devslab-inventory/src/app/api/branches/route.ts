import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/Auth'

// GET all branches
export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedBranches = branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      location: branch.location,
      type: branch.type,
      phone: branch.phone,
      email: branch.email,
      isActive: branch.isActive,
      userCount: branch.users.length,
      createdAt: branch.createdAt
    }))

    return NextResponse.json(formattedBranches)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

// POST create new branch
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HQ_MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.code || !body.location || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        code: body.code,
        location: body.location,
        type: body.type,
        phone: body.phone || null,
        email: body.email || null,
        isActive: true
      }
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}