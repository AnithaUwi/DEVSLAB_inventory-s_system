'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Plus, ArrowUp, ArrowDown, 
  Truck, RefreshCw, AlertCircle, History 
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import CreateMovementModal from '@/components/stock/CreateMovementModal'

export default function StockMovementsPage() {
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const { data: session } = useSession()
  
  useEffect(() => {
    fetchMovements()
  }, [session])

  const fetchMovements = async () => {
    if (!session) return
    try {
      const response = await fetch('/api/stock-movements')
      const data = await response.json()
      setMovements(data)
    } catch (error) {
      console.error('Failed to fetch movements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get movement type icon and color
  const getMovementInfo = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return { icon: ArrowDown, color: 'bg-green-100 text-green-800', label: 'Receive' }
      case 'ISSUE':
        return { icon: ArrowUp, color: 'bg-red-100 text-red-800', label: 'Issue' }
      case 'TRANSFER':
        return { icon: Truck, color: 'bg-blue-100 text-blue-800', label: 'Transfer' }
      case 'RETURN':
        return { icon: RefreshCw, color: 'bg-yellow-100 text-yellow-800', label: 'Return' }
      case 'ADJUST':
        return { icon: AlertCircle, color: 'bg-purple-100 text-purple-800', label: 'Adjust' }
      case 'DISPOSE':
        return { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Dispose' }
      default:
        return { icon: History, color: 'bg-gray-100 text-gray-800', label: type }
    }
  }

  return (
    <div className="p-6">
      {!session && (
        <p className="text-gray-600">Loading your session...</p>
      )}
      {session && (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-3 text-blue-600" />
            Stock Movements
          </h1>
          <p className="text-gray-600">Track all inventory transactions</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Movement
          </button>
          
          <button
            onClick={fetchMovements}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{movements.length}</div>
          <div className="text-sm text-gray-600">Total Movements</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {movements.filter(m => m.type === 'RECEIVE').length}
          </div>
          <div className="text-sm text-gray-600">Receives</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {movements.filter(m => m.type === 'ISSUE').length}
          </div>
          <div className="text-sm text-gray-600">Issues</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {movements.filter(m => m.type === 'TRANSFER').length}
          </div>
          <div className="text-sm text-gray-600">Transfers</div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading movements...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No stock movements found</p>
            <p className="mt-2">Record your first stock movement to start tracking inventory.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record First Movement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movements.map((movement: any) => {
                  const { icon: Icon, color, label } = getMovementInfo(movement.type)
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{movement.item?.name}</div>
                        <div className="text-sm text-gray-500">{movement.item?.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        {movement.type === 'TRANSFER' ? (
                          <div className="text-sm text-gray-900">
                            {movement.fromBranch?.name} → {movement.toBranch?.name}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-900">{movement.branch?.name}</div>
                            <div className="text-xs text-gray-500">{movement.branch?.code}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {movement.bus ? (
                          <div className="text-sm text-gray-900 font-mono">
                            {movement.bus.plateNumber}
                            {movement.bus.fleetNumber && (
                              <div className="text-xs text-gray-500">Fleet: {movement.bus.fleetNumber}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${
                          movement.type === 'RECEIVE' || movement.type === 'RETURN' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {movement.type === 'RECEIVE' || movement.type === 'RETURN' ? '+' : '-'}
                          {movement.quantity} {movement.item?.unitOfMeasure}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {movement.reference || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {movement.user?.name || movement.user?.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showForm && session?.user && (
        <CreateMovementModal
          currentUser={{
            id: session.user.id,
            name: session.user.name || 'Current User',
            branchId: session.user.branchId || undefined
          }}
          onClose={() => setShowForm(false)}
          onSuccess={fetchMovements}
        />
      )}
      </>
      )}
    </div>
  )
}