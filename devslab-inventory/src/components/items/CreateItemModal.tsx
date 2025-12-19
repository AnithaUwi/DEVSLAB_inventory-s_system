'use client'

import { useState, useEffect } from 'react'
import { Package, ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Hardcoded categories
  const categories = [
    'Engine Parts',
    'Brake System',
    'Body Parts',
    'Electrical',
    'Suspension',
    'Transmission',
    'Fuel System',
    'Cooling System',
    'Exhaust',
    'Accessories'
  ]
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unitOfMeasure: 'pcs',
    reorderLevel: 10,
    currentPrice: 0
  })

  // Debug logging
  useEffect(() => {
    console.log('🔍 DEBUG - Form State:')
    console.log('  Name:', formData.name, 'Empty?', !formData.name)
    console.log('  Category:', formData.category, 'Empty?', !formData.category)
    console.log('  Loading:', loading)
    console.log('  Button disabled?:', loading || !formData.name || !formData.category)
  }, [formData, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔄 Submitting form...')
    console.log('Form data:', formData)
    
    setLoading(true)
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Item name is required')
      setLoading(false)
      return
    }

    if (!formData.category.trim()) {
      setError('Please select a category')
      setLoading(false)
      return
    }

    if (formData.reorderLevel < 0) {
      setError('Reorder level cannot be negative')
      setLoading(false)
      return
    }

    if (formData.currentPrice < 0) {
      setError('Price cannot be negative')
      setLoading(false)
      return
    }

    try {
      console.log('📤 Sending request to /api/items')
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log(' Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create item')
      }

      alert(` Item created successfully!\n\nCode: ${data.item?.code}\nName: ${data.item?.name}`)
      router.push('/dashboard/items')
      
    } catch (err: any) {
      console.error(' Error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const unitOptions = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'set', label: 'Set' },
    { value: 'pair', label: 'Pair' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/items"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Items
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Package className="h-6 w-6 mr-3 text-brand" />
          Add New Item
        </h1>
        <p className="text-gray-600 mt-1">Add a new spare part to your inventory</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g., Brake Pad Set"
                  disabled={loading}
                />
                {!formData.name && (
                  <p className="text-xs text-red-500 mt-1">Item name is required</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {!formData.category && (
                  <p className="text-xs text-red-500 mt-1">Please select a category</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Item description, specifications, or notes..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Inventory Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unit of Measure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  disabled={loading}
                >
                  {unitOptions.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g., 10"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum quantity before restock alert
                </p>
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Price (RWF)
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0.00"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Last purchase price per unit
                </p>
              </div>
            </div>
          </div>

          {/* Debug Info (remove after fixing) */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Debug Info:</p>
            <p className="text-xs text-gray-600">
              Name: "{formData.name}" | Category: "{formData.category}"<br />
              Button will enable when: Name AND Category are filled
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t flex justify-end space-x-3">
            <Link
              href="/dashboard/items"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.category}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}