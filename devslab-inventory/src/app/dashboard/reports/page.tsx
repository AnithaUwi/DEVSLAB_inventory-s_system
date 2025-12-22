import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/Auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { MovementType, UserRole } from '@prisma/client'
import { PDFExportButton } from '@/components/reports/PDFExportButton'

const BRANCH_SCOPED_ROLES: UserRole[] = ['BRANCH_MANAGER', 'STOREKEEPER', 'MECHANIC']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(value)

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const branchIdFilter = BRANCH_SCOPED_ROLES.includes(session.user.role)
    ? session.user.branchId ?? undefined
    : undefined

  const [balances, movementCounts] = await Promise.all([
    prisma.stockBalance.findMany({
      where: branchIdFilter ? { branchId: branchIdFilter } : {},
      include: { item: true, branch: true },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.stockMovement.groupBy({
      by: ['type'],
      _count: { _all: true },
      where: branchIdFilter
        ? {
            OR: [
              { branchId: branchIdFilter },
              { fromBranchId: branchIdFilter },
              { toBranchId: branchIdFilter }
            ]
          }
        : {}
    })
  ])

  const movementMap = movementCounts.reduce<Record<MovementType, number>>((acc, row) => {
    acc[row.type] = row._count._all
    return acc
  }, {} as Record<MovementType, number>)

  const stockValue = balances.reduce(
    (sum, bal) => sum + bal.quantity * (bal.item.currentPrice || 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            {branchIdFilter ? 'Branch report' : 'Organization-wide report'} with live numbers.
          </p>
        </div>
        
        {/* PDF Export Button - Client Component */}
        <PDFExportButton
          balances={balances}
          movementMap={movementMap}
          stockValue={stockValue}
          branchIdFilter={branchIdFilter}
          session={session}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stockValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Movements</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span>Receives</span><span className="font-semibold text-green-700">{movementMap.RECEIVE || 0}</span></div>
            <div className="flex justify-between"><span>Issues</span><span className="font-semibold text-red-700">{movementMap.ISSUE || 0}</span></div>
            <div className="flex justify-between"><span>Transfers</span><span className="font-semibold text-blue-700">{movementMap.TRANSFER || 0}</span></div>
            <div className="flex justify-between"><span>Returns</span><span className="font-semibold text-amber-700">{movementMap.RETURN || 0}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-700">
              {balances.filter(b => b.quantity < b.item.reorderLevel).length}
            </p>
            <p className="text-sm text-gray-600">Below reorder level</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-left px-4 py-2">Branch</th>
                  <th className="text-left px-4 py-2">Quantity</th>
                  <th className="text-left px-4 py-2">Reorder</th>
                  <th className="text-left px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {balances.slice(0, 25).map((bal) => (
                  <tr key={bal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{bal.item.name}</div>
                      <div className="text-xs text-gray-500">{bal.item.code}</div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {bal.branch?.name || 'Branch'}
                    </td>
                    <td className="px-4 py-2 font-semibold">{bal.quantity}</td>
                    <td className="px-4 py-2 text-gray-600">{bal.item.reorderLevel}</td>
                    <td className="px-4 py-2 text-gray-900">
                      {formatCurrency((bal.item.currentPrice || 0) * bal.quantity)}
                    </td>
                  </tr>
                ))}
                {balances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                      No balances yet. Record a stock movement to populate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}