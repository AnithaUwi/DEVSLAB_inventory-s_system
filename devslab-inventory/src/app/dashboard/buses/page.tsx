'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Eye, Package, Calendar, Building, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import CreateBusModal from '@/components/buses/CreateBusModal'

export default function BusesPage() {
  const [loading, setLoading] = useState(true)
  const [buses, setBuses] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchBuses()
  }, [session])

  const fetchBuses = async () => {
    if (!session) return
    try {
      const response = await fetch('/api/buses')
      const data = await response.json()
      setBuses(data)
    } catch (error) {
      console.error('Failed to fetch buses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading your session...</p>
      </div>
    )
  }

  const canCreate = ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER'].includes(session.user.role)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Truck className="h-6 w-6 mr-3 text-blue-600" />
            Buses & Consumption
          </h1>
          <p className="text-gray-600">Track parts issued to buses and consumption history</p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bus
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{buses.length}</div>
          <div className="text-sm text-gray-600">Total Buses</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {buses.filter(b => b.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Buses</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {buses.reduce((sum, b) => sum + (b.stats?.totalIssues || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Issues</div>
        </div>
      </div>

      {/* Buses Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading buses...</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No buses found</p>
            <p className="mt-2">Add your first bus to start tracking consumption.</p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Bus
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {buses.map((bus: any) => (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-gray-900">{bus.plateNumber}</div>
                      {bus.fleetNumber && (
                        <div className="text-xs text-gray-500">Fleet: {bus.fleetNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {bus.make || bus.model ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {bus.make} {bus.model}
                          </div>
                          {bus.year && (
                            <div className="text-xs text-gray-500">{bus.year}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{bus.branch?.name}</div>
                      <div className="text-xs text-gray-500">{bus.branch?.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {bus.stats?.totalIssues || 0} issues
                      </div>
                      <div className="text-xs text-gray-500">
                        {bus.stats?.totalQuantity || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {bus.stats?.lastIssue ? (
                        <div>
                          <div>{new Date(bus.stats.lastIssue).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(bus.stats.lastIssue).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        bus.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bus.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && session?.user && (
        <CreateBusModal
          currentUser={session.user}
          onClose={() => setShowForm(false)}
          onSuccess={fetchBuses}
        />
      )}
    </div>
  )
}
