'use client'

import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  Building,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  Truck,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react'

interface SidebarProps {
  userRole: UserRole
}

const adminNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Items', href: '/dashboard/items', icon: Package },
  { name: 'Stock Movements', href: '/dashboard/stock-movements', icon: RefreshCw },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Branches', href: '/dashboard/branches', icon: Building },
  { name: 'Buses', href: '/dashboard/buses', icon: Truck },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Audit Log', href: '/dashboard/audit', icon: ClipboardCheck },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const roleNav: Record<UserRole, typeof adminNavItems> = {
  ADMIN: adminNavItems,
  HQ_MANAGER: adminNavItems,
  BRANCH_MANAGER: adminNavItems.filter(item => !['Users', 'Settings'].includes(item.name)),
  STOREKEEPER: adminNavItems.filter(item => ['Dashboard', 'Items', 'Stock Movements', 'Reports', 'Buses'].includes(item.name)),
  MECHANIC: adminNavItems.filter(item => ['Dashboard', 'Stock Movements', 'Buses'].includes(item.name)),
  AUDITOR: adminNavItems.filter(item => ['Dashboard', 'Stock Movements', 'Reports', 'Audit Log'].includes(item.name)),
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const navItems = roleNav[userRole] || adminNavItems

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-white">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">System Status</p>
          <div className="flex items-center mt-1">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <p className="text-xs text-blue-700">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  )
}