import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendTestEmail } from '@/lib/email'
async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client')
  return new PrismaClient()
}

// GET all users
export async function GET() {
  const prisma = await getPrisma()
  
  try {
    console.log(' Fetching users...')
    
    // SIMPLE VERSION FIRST - avoid complex relations
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,  // Just get the ID
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(` Found ${users.length} users`)
    
    // Get branches separately
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        code: true
      }
    })
    
    // Create branch map for easy lookup
    const branchMap = new Map()
    branches.forEach(branch => {
      branchMap.set(branch.id, branch)
    })
    
    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branchId ? branchMap.get(user.branchId) : null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))
    
    return NextResponse.json(formattedUsers)
    
  } catch (error: any) {
    console.error(' GET Users Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST create new user
export async function POST(request: Request) {
  const prisma = await getPrisma()
  
  try {
    console.log(' Creating new user...')
    
    const body = await request.json()
    console.log('User data:', body)
    
    // Validation
    if (!body.name || !body.email || !body.role || !body.branchId || !body.password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }
    
     if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

     // Get branch info for email
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
      select: { name: true }
    })
    
    // Generate random password (for demo)
    const tempPassword = Math.random().toString(36).slice(-10) + 
                         Math.random().toString(36).slice(-10).toUpperCase()
    const tempPasswordPlain = tempPassword // Save for email
    
    // Hash the password
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword, // Hashed password
        role: body.role,
        branchId: body.branchId,
        isActive: true
      },
      include: {
        branch: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    
    console.log(' User created:', user.email)
    
     let emailSent = false
    let emailError = '' // TODO: Send email notification (implement later)
  // Import at top


// In your POST function, replace email section:
if (body.sendEmail !== false) {
  const result = await sendTestEmail({
    email: user.email,
    name: user.name,
    password: tempPasswordPlain,
    role: user.role,
    branchName: branch?.name
  })
  
  emailSent = result.success
  emailError = result.error || ''
  
  if (result.previewUrl) {
    console.log('📧 Email preview:', result.previewUrl)
    // You can return this to frontend
    const emailPreviewUrl = result.previewUrl
  }
}
    // Return response with email status
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branch: user.branch,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
      },
      emailSent,
      emailError: emailError || undefined
    },
     { status: 201 })
    
  } catch (error: any) {
    console.error(' POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH update user status (activate/deactivate)
export async function PATCH(request: Request) {
  const prisma = await getPrisma()
  
  try {
    const body = await request.json()
    
    if (!body.userId || typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'userId and isActive are required' },
        { status: 400 }
      )
    }
    
    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: body.userId },
      data: { isActive: body.isActive },
      include: {
        branch: {
          select: { name: true, code: true }
        }
      }
    })
    
    console.log(` User ${updatedUser.email} ${body.isActive ? 'activated' : 'deactivated'}`)
    
    return NextResponse.json({
      success: true,
      message: `User ${body.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        branch: updatedUser.branch
      }
    })
    
  } catch (error: any) {
    console.error('PATCH Error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE user permanently
export async function DELETE(request: Request) {
  const prisma = await getPrisma()
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Prevent deleting yourself (optional safety)
    // You can get current user ID from session if using auth
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Optional: Prevent deleting ADMIN users (safety)
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete ADMIN users' },
        { status: 403 }
      )
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })
    
    console.log(` User deleted permanently: ${user.email}`)
    
    return NextResponse.json({
      success: true,
      message: 'User deleted permanently'
    })
    
  } catch (error: any) {
    console.error(' DELETE Error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}