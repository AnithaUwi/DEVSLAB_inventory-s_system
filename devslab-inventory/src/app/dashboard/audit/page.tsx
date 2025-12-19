import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/Auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

const BRANCH_SCOPED_ROLES: UserRole[] = ['BRANCH_MANAGER', 'STOREKEEPER', 'MECHANIC']

export default async function AuditPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const branchIdFilter = BRANCH_SCOPED_ROLES.includes(session.user.role)
    ? session.user.branchId ?? undefined
    : undefined

  const logs = await prisma.stockMovement.findMany({
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
      item: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
      branch: { select: { name: true } },
      fromBranch: { select: { name: true } },
      toBranch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600">Recent inventory actions with who/when details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">When</th>
                  <th className="text-left px-4 py-2">User</th>
                  <th className="text-left px-4 py-2">Action</th>
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-left px-4 py-2">Branch</th>
                  <th className="text-left px-4 py-2">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {log.user?.name || log.user?.email || 'User'}
                    </td>
                    <td className="px-4 py-2 font-semibold">{log.type}</td>
                    <td className="px-4 py-2">
                      <div className="text-gray-900">{log.item?.name}</div>
                      <div className="text-xs text-gray-500">{log.item?.code}</div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {log.type === 'TRANSFER'
                        ? `${log.fromBranch?.name || 'From?'} → ${log.toBranch?.name || 'To?'}`
                        : log.branch?.name || 'Branch'}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{log.reference || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 px-4 py-4">
                      No actions recorded yet.
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

