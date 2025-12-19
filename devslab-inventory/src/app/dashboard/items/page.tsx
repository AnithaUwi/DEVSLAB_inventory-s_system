'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' 
import { Package, Plus, Trash2, Edit, Eye, DollarSign, AlertTriangle, BarChart3,Search, Filter, X } from 'lucide-react'
import Link from 'next/link'

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter() 
    const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      setItems(data)
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(items.map(item => item.category))]
  const totalItems = items.length
  const totalValue = items.reduce((sum, item) => sum + (item.currentPrice * 100), 0) / 100
  const lowStockItems = items.filter(item => 
    (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) < item.reorderLevel
  ).length
  const categoriesCount = new Set(items.map(item => item.category)).size

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete item "${name}"?`)) return
    
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' })
      fetchItems() // Refresh
      alert(' Item deleted!')
    } catch (error) {
      alert('Failed to delete')
    }
  }
const filteredItems = items.filter(item => {
  // Search filter
  const matchesSearch = searchTerm === '' || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  
  // Category filter
  const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
  
  // Low stock filter
  const matchesLowStock = !showLowStockOnly || ((item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) < item.reorderLevel)
  
  return matchesSearch && matchesCategory && matchesLowStock
})
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-3 text-blue-600" />
            Items Management
          </h1>
          <p className="text-gray-600">Manage your inventory items</p>
        </div>
        
        <Link
          href="/dashboard/items/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Items */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                RWF {totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Inventory Value</div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{lowStockItems}</div>
              <div className="text-sm text-gray-600">Low Stock Items</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{categoriesCount}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section - ADD THIS */}
<div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
  <div className="flex flex-col md:flex-row gap-4">
    
    {/* Search Input */}
    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by name, code, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
    
    {/* Category Filter */}
    <div className="w-full md:w-64">
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="all">All Categories</option>
          {categories
            .filter(cat => cat !== 'all')
            .map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))
          }
        </select>
      </div>
    </div>
    
    {/* Low Stock Toggle */}
    <div className="flex items-center">
      <button
        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        className={`flex items-center px-4 py-2 rounded-lg border ${
          showLowStockOnly
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-gray-50 border-gray-300 text-gray-700'
        }`}
      >
        <AlertTriangle className={`h-5 w-5 mr-2 ${
          showLowStockOnly ? 'text-red-600' : 'text-gray-500'
        }`} />
        Low Stock Only
      </button>
    </div>
    
  </div>
  
  {/* Active Filters Info */}
  {(searchTerm || selectedCategory !== 'all' || showLowStockOnly) && (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Category: {selectedCategory}
              <button 
                onClick={() => setSelectedCategory('all')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {showLowStockOnly && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">
              Low Stock Only
              <button 
                onClick={() => setShowLowStockOnly(false)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
        
        <button
          onClick={() => {
            setSearchTerm('')
            setSelectedCategory('all')
            setShowLowStockOnly(false)
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear all
        </button>
      </div>
    </div>
  )}
</div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No items found</p>
            <p className="mt-2">Start by adding your first inventory item.</p>
            <Link
              href="/dashboard/items/create"
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900">{item.code}</span>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${
                        (item.stockQuantity || 0) < item.reorderLevel 
                          ? 'text-red-600' 
                          : (item.stockQuantity || 0) === 0 
                            ? 'text-gray-400' 
                            : 'text-green-600'
                      }`}>
                        {item.stockQuantity !== undefined ? item.stockQuantity : '0'} {item.unitOfMeasure}
                      </div>
                      {(item.stockQuantity || 0) < item.reorderLevel && (item.stockQuantity || 0) > 0 && (
                        <div className="text-xs text-red-600 mt-1">Low stock!</div>
                      )}
                      {(item.stockQuantity || 0) === 0 && (
                        <div className="text-xs text-gray-500 mt-1">No stock</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.unitOfMeasure}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        item.reorderLevel >= 50 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.reorderLevel}
                        {item.reorderLevel >= 50 && (
                          <AlertTriangle className="h-4 w-4 inline ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      RWF {item.currentPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* View - FIXED */}
                        <button
                          onClick={() => router.push(`/dashboard/items/view/${item.id}`)}
                          className="p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Edit */}
                        <button
                          onClick={() => window.location.href = `/dashboard/items/edit/${item.id}`}
                          className="p-2 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
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


      {!loading && items.length > 0 && (
  <div className="mt-4 px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
    Showing {filteredItems.length} of {items.length} items
    {(searchTerm || selectedCategory !== 'all' || showLowStockOnly) && ' (filtered)'}
  </div>
)}

    </div>
  )
}