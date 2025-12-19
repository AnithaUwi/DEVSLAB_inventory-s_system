'use client'

import { useState, useEffect } from 'react'
import { Building, Plus, CheckCircle, XCircle, Edit, Trash2, Loader2 } from 'lucide-react'
import CreateBranchModal from '../../../components/branches/CreateBranchModal'

// Temporary button 
const Button = ({ children, className, onClick, variant = 'default', disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium inline-flex items-center ${
      variant === 'default'
        ? 'bg-brand text-white hover:bg-brand-600 disabled:bg-gray-400'
        : 'border border-gray-300 bg-white hover:bg-gray-100 disabled:bg-gray-100'
    } ${className}`}
  >
    {children}
  </button>
)

type Branch = {
  id: string
  name: string
  code: string
  location: string
  type: 'HQ' | 'BRANCH'
  phone?: string
  email?: string
  isActive: boolean
  userCount: number
  createdAt: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refetch, setRefetch] = useState(0) // Trigger refetch

  // Fetch real branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/branches')
        
        if (!response.ok) {
          throw new Error('Failed to fetch branches')
        }
        
        const data = await response.json()
        setBranches(data)
      } catch (error) {
        console.error('Error:', error)
        alert('Failed to load branches')
      } finally {
        setLoading(false)
      }
    }

    fetchBranches()
  }, [refetch])

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    setRefetch(prev => prev + 1) // Trigger refetch
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building className="h-8 w-8 mr-3 text-brand" />
            Branches Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage all branches (HQ and service centers)
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Branch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Total Branches</p>
          <p className="text-2xl font-bold">{branches.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Active Branches</p>
          <p className="text-2xl font-bold">{branches.filter(b => b.isActive).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">HQ</p>
          <p className="text-2xl font-bold">{branches.filter(b => b.type === 'HQ').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Service Centers</p>
          <p className="text-2xl font-bold">{branches.filter(b => b.type === 'BRANCH').length}</p>
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">All Branches</h2>
          <p className="text-sm text-gray-500">Real data from database</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            <p className="mt-2 text-gray-600">Loading branches from database...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No branches yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first branch.</p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Branch
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{branch.name}</p>
                        <p className="text-sm text-gray-500">{branch.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                        {branch.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{branch.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        branch.type === 'HQ' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {branch.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{branch.userCount}</span>
                      <span className="text-gray-500 text-sm ml-1">users</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {branch.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-red-700">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(branch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit branch"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Deactivate branch"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <CreateBranchModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}