'use client'

import { useState, useEffect } from 'react'
import { 
  X, Save, Loader2, Package, Building, User, 
  ArrowDown, ArrowUp, Truck, RefreshCw, AlertCircle,
  Search, ChevronDown
} from 'lucide-react'

interface CreateMovementModalProps {
  onClose: () => void
  onSuccess: () => void
  currentUser: {
    id: string
    name: string
    branchId?: string
  }
}

export default function CreateMovementModal({ 
  onClose, 
  onSuccess,
  currentUser 
}: CreateMovementModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Data states
  const [items, setItems] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [buses, setBuses] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'RECEIVE',
    itemId: '',
    branchId: currentUser.branchId || '',
    fromBranchId: '',
    toBranchId: '',
    busId: '',
    quantity: 1,
    reference: '',
    notes: '',
    userId: currentUser.id
  })

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.type === 'TRANSFER' && currentUser.branchId && !formData.fromBranchId) {
      setFormData(prev => ({ ...prev, fromBranchId: currentUser.branchId! }))
    }
  }, [formData.type, currentUser.branchId, formData.fromBranchId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch items
      const itemsRes = await fetch('/api/items')
      const itemsData = await itemsRes.json()
      setItems(itemsData)
      
      // Fetch branches
      const branchesRes = await fetch('/api/branches')
      const branchesData = await branchesRes.json()
      setBranches(branchesData)
      
      // Fetch buses (for ISSUE movements)
      const busesRes = await fetch('/api/buses')
      if (busesRes.ok) {
        const busesData = await busesRes.json()
        setBuses(busesData.filter((b: any) => b.isActive))
      }
      
      // Set default branch if user has one
      if (currentUser.branchId && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: currentUser.branchId! }))
      }
      
    } catch (err: any) {
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (!formData.itemId || !formData.quantity || !formData.userId) {
      setError('Please fill all required fields')
      setSubmitting(false)
      return
    }

    // For non-transfer movements, branchId is required
    if (formData.type !== 'TRANSFER' && !formData.branchId) {
      setError('Please select a branch')
      setSubmitting(false)
      return
    }

    if (formData.type === 'TRANSFER' && (!formData.fromBranchId || !formData.toBranchId)) {
      setError('Please select both source and destination branches for transfers')
      setSubmitting(false)
      return
    }

    if (formData.type === 'TRANSFER' && formData.fromBranchId === formData.toBranchId) {
      setError('Source and destination branches must be different')
      setSubmitting(false)
      return
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0')
      setSubmitting(false)
      return
    }

    try {
      // Clean up the data before sending - remove empty strings and only include relevant fields
      const payload: any = {
        type: formData.type,
        itemId: formData.itemId,
        quantity: formData.quantity,
        branchId: formData.branchId || undefined,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      }

      // Only include transfer fields if it's a transfer
      if (formData.type === 'TRANSFER') {
        payload.fromBranchId = formData.fromBranchId
        payload.toBranchId = formData.toBranchId
      }
      
      // Include bus ID for ISSUE movements
      if (formData.type === 'ISSUE' && formData.busId) {
        payload.busId = formData.busId
      }

      // Remove undefined/null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '' || payload[key] === null) {
          delete payload[key]
        }
      })

      console.log('Sending payload:', payload)

      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record movement')
      }

      alert(` Stock movement recorded successfully!\nType: ${formData.type}\nQuantity: ${formData.quantity}`)
      onSuccess()
      onClose()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
    
    // Reset related fields when type changes
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        fromBranchId: '',
        toBranchId: '',
        busId: ''
      }))
    }

    // For transfers, sync branchId with destination
    if (name === 'toBranchId' && formData.type === 'TRANSFER') {
      setFormData(prev => ({ ...prev, branchId: value }))
    }
  }

  // Movement type options
  const movementTypes = [
    { value: 'RECEIVE', label: 'Receive from Supplier', icon: ArrowDown, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'ISSUE', label: 'Issue to Mechanic/Bus', icon: ArrowUp, color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'TRANSFER', label: 'Transfer between Branches', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'RETURN', label: 'Return to Store', icon: RefreshCw, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'ADJUST', label: 'Adjust Stock Count', icon: AlertCircle, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { value: 'DISPOSE', label: 'Dispose/Damaged', icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  ]

  const selectedType = movementTypes.find(t => t.value === formData.type)
  const canPickBranch = !currentUser.branchId

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${selectedType?.bgColor || 'bg-blue-50'}`}>
              {selectedType?.icon ? (
                <selectedType.icon className={`h-6 w-6 ${selectedType.color || 'text-blue-600'}`} />
              ) : (
                <Package className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Record Stock Movement</h2>
              <p className="text-sm text-gray-600">{selectedType?.label || 'Record inventory transaction'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={submitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {movementTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.type === type.value
                      ? `${type.bgColor} border-${type.color.split('-')[1]}-300`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <type.icon className={`h-5 w-5 ${type.color} mr-2`} />
                    <span className="text-sm font-medium">{type.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={submitting}
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name} ({item.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 10"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Branch Selection */}
          {formData.type !== 'TRANSFER' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={submitting || !canPickBranch}
                >
                  <option value="">Select a branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {!canPickBranch && (
                <p className="text-xs text-gray-500 mt-1">
                  Locked to your branch
                </p>
              )}
            </div>
          ) : (
            /* Transfer-specific fields */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Branch *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="fromBranchId"
                    value={formData.fromBranchId}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={submitting || !canPickBranch}
                  >
                    <option value="">Select source branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Branch *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="toBranchId"
                    value={formData.toBranchId}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={submitting}
                  >
                    <option value="">Select destination branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bus Selection (for ISSUE movements) */}
          {formData.type === 'ISSUE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus (Optional)
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={submitting}
                >
                  <option value="">Select a bus (optional)</option>
                  {buses
                    .filter((bus: any) => !formData.branchId || bus.branch?.id === formData.branchId)
                    .map((bus: any) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plateNumber} {bus.fleetNumber ? `(${bus.fleetNumber})` : ''} - {bus.branch?.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Link this issue to a specific bus for consumption tracking
              </p>
            </div>
          )}

          {/* User (auto-set from current user) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recorded By
            </label>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
              <User className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {currentUser.name} (You)
                </div>
                <div className="text-xs text-gray-500">
                  This movement will be recorded under your account
                </div>
              </div>
            </div>
          </div>

          {/* Reference and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., PO-001, WO-001, TRF-001"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional information..."
                disabled={submitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.itemId || !formData.quantity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Record Movement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}