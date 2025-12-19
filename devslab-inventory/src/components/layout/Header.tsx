'use client'

import { UserRole } from '@prisma/client'
import { LogOut, Bell, Search, Menu } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role: UserRole
  }
}

export default function Header({ user }: HeaderProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    HQ_MANAGER: 'bg-blue-100 text-blue-800',
    BRANCH_MANAGER: 'bg-green-100 text-green-800',
    STOREKEEPER: 'bg-amber-100 text-amber-800',
    MECHANIC: 'bg-gray-100 text-gray-800',
    AUDITOR: 'bg-indigo-100 text-indigo-800',
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Brand & Search */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">DEVSLAB Inventory</h1>
              <p className="text-xs text-gray-500">Spare Parts Management</p>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search items, users, reports..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right: User & Notifications */}
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${roleColors[user.role]}`}>
                  {user.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>

            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          <button className="md:hidden p-2">
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}