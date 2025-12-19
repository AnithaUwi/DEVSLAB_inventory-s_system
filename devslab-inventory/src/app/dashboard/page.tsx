import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Users, 
  Building, 
  TrendingUp,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/Auth'
import { MovementType, UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

const BRANCH_SCOPED_ROLES: UserRole[] = ['BRANCH_MANAGER', 'STOREKEEPER', 'MECHANIC']

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(value)

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const isBranchScoped = BRANCH_SCOPED_ROLES.includes(session.user.role)
  const branchIdFilter = isBranchScoped ? session.user.branchId ?? undefined : undefined

  const [
    itemCount,
    userCount,
    branchCount,
    balances,
    recentMovements
  ] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, ...(branchIdFilter ? { branchId: branchIdFilter } : {}) } }),
    prisma.branch.count(),
    prisma.stockBalance.findMany({
      where: branchIdFilter ? { branchId: branchIdFilter } : {},
      include: { item: true }
    }),
    prisma.stockMovement.findMany({
      where: branchIdFilter
        ? {
            OR: [
              { branchId: branchIdFilter },
              { fromBranchId: branchIdFilter },
              { toBranchId: branchIdFilter }
            ]
          }
        : {},
      include: {
        item: { select: { name: true, code: true, unitOfMeasure: true } },
        branch: { select: { name: true } },
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    })
  ])

  const stockValue = balances.reduce((sum, bal) => sum + bal.quantity * (bal.item.currentPrice || 0), 0)
  const lowStock = balances.filter(bal => bal.quantity < bal.item.reorderLevel)
  const receives = recentMovements.filter(m => m.type === MovementType.RECEIVE).length
  const issues = recentMovements.filter(m => m.type === MovementType.ISSUE).length
  const transfers = recentMovements.filter(m => m.type === MovementType.TRANSFER).length

  const stats = [
    { title: 'Total Items', value: formatNumber(itemCount), icon: Package, color: 'bg-blue-500' },
    { title: 'Active Users', value: formatNumber(userCount), icon: Users, color: 'bg-green-500' },
    { title: 'Branches', value: formatNumber(branchCount), icon: Building, color: 'bg-purple-500' },
    { title: 'Low Stock Items', value: formatNumber(lowStock.length), icon: AlertTriangle, color: 'bg-amber-500' },
    { title: 'Stock Value', value: formatCurrency(stockValue), icon: TrendingUp, color: 'bg-emerald-500' },
    { title: 'Recent Movements', value: formatNumber(recentMovements.length), icon: RefreshCw, color: 'bg-sky-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name || 'User'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isBranchScoped
            ? 'Branch view: numbers shown for your branch only.'
            : 'HQ view: organization-wide numbers.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMovements.length === 0 && (
                <p className="text-sm text-gray-500">No movements recorded yet.</p>
              )}
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-start">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {movement.type === 'RECEIVE' && <ArrowDown className="h-4 w-4 text-green-600" />}
                    {movement.type === 'ISSUE' && <ArrowUp className="h-4 w-4 text-red-600" />}
                    {movement.type === 'TRANSFER' && <RefreshCw className="h-4 w-4 text-blue-600" />}
                    {movement.type !== 'RECEIVE' && movement.type !== 'ISSUE' && movement.type !== 'TRANSFER' && (
                      <FileText className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {movement.item?.name} ({movement.item?.code})
                    </p>
                    <p className="text-xs text-gray-600">
                      {movement.type} • {movement.quantity} {movement.item?.unitOfMeasure}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.type === 'TRANSFER'
                        ? `${movement.fromBranch?.name || 'From?'} → ${movement.toBranch?.name || 'To?'}`
                        : movement.branch?.name || 'Branch'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm text-gray-600">Receives (recent)</p>
                <p className="text-xl font-semibold text-green-600">{receives}</p>
              </div>
              <ArrowDown className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm text-gray-600">Issues (recent)</p>
                <p className="text-xl font-semibold text-red-600">{issues}</p>
              </div>
              <ArrowUp className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm text-gray-600">Transfers (recent)</p>
                <p className="text-xl font-semibold text-blue-600">{transfers}</p>
              </div>
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-gray-900 mb-2">Low stock</p>
              {lowStock.length === 0 && (
                <p className="text-sm text-gray-500">No low stock items right now.</p>
              )}
              {lowStock.slice(0, 4).map((bal) => (
                <div key={bal.id} className="flex justify-between text-sm py-1">
                  <span>{bal.item.name}</span>
                  <span className="text-amber-600 font-semibold">
                    {bal.quantity} / {bal.item.reorderLevel}
                  </span>
                </div>
              ))}
              {lowStock.length > 4 && (
                <p className="text-xs text-gray-500 mt-1">+{lowStock.length - 4} more below reorder</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}