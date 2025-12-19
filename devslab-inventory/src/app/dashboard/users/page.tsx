'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, CheckCircle, XCircle, Building, Mail, Trash2, Power,PowerOff} from 'lucide-react'
import CreateUserModal from '@/components/users/CreateUserModal'
import DeleteUserModal from '@/components/users/DeleteUserModal'
// Temporary button 

const Button = ({ children, className, onClick, variant = 'default' }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium inline-flex items-center ${
      variant === 'default'
        ? 'bg-brand text-white hover:bg-brand-600'
        : 'border border-gray-300 bg-white hover:bg-gray-100'
    } ${className}`}
  >
    {children}
  </button>
)

type User = {
  id: string
  email: string
  name: string
  role: string
  branch: {
    name: string
    code: string
  } | null
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userToDelete, setUserToDelete] = useState<null | any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      
      const data = await response.json()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, newStatus: boolean) => {
  if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
    return
  }

  try {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        isActive: newStatus
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user')
    }

    alert(` User ${newStatus ? 'activated' : 'deactivated'} successfully`)
    fetchUsers() // Refresh the list
    
  } catch (err: any) {
    alert(`Error: ${err.message}`)
    console.error('Toggle status error:', err)
  }
}

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    HQ_MANAGER: 'bg-blue-100 text-blue-800',
    BRANCH_MANAGER: 'bg-green-100 text-green-800',
    STOREKEEPER: 'bg-amber-100 text-amber-800',
    MECHANIC: 'bg-gray-100 text-gray-800',
    AUDITOR: 'bg-indigo-100 text-indigo-800'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-brand" />
            Users Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage system users with role-based access
          </p>
        </div>
        
        <Button 
  onClick={() => setShowCreateModal(true)}
  className="flex items-center"
>
  <UserPlus className="h-4 w-4 mr-2" />
  Add New User
</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">Roles</p>
          <p className="text-2xl font-bold">{new Set(users.map(u => u.role)).size}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600">With Branch</p>
          <p className="text-2xl font-bold">{users.filter(u => u.branch).length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">All Users</h2>
          <p className="text-sm text-gray-500">Real data from database</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600">Error: {error}</div>
            <Button onClick={fetchUsers} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No users yet</h3>
            <p className="mt-1 text-sm text-gray-500">Only admin exists. Add more users.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[user.role] || 'bg-gray-100'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.branch ? (
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-sm">{user.branch.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({user.branch.code})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No branch assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.isActive ? (
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
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
  <button
    onClick={() => handleToggleStatus(user.id, !user.isActive)}
    className={`text-sm px-3 py-1 rounded ${
      user.isActive
        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
    }`}
    disabled={user.role === 'ADMIN'} // Can't deactivate admin
    title={user.role === 'ADMIN' ? 'Cannot deactivate admin' : ''}
  >
    {user.isActive ? 'Deactivate' : 'Activate'}
  </button>

   <button
    onClick={() => setUserToDelete(user)}
    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
  >
    <Trash2 className="h-3 w-3 mr-1" />
    Delete
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>

            
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <span className="font-semibold"></span>
        </p>
      </div>
{showCreateModal && (
  <CreateUserModal
    onClose={() => setShowCreateModal(false)}
    onSuccess={() => {
      setShowCreateModal(false)
      fetchUsers() // Refresh the list
    }}
  />
)}

{userToDelete && (
  <DeleteUserModal
    user={userToDelete}
    onClose={() => setUserToDelete(null)}
    onSuccess={() => {
      setUserToDelete(null)
      // Refresh users list
      fetchUsers()
    }}
  />
)}

    </div>
  )
}

