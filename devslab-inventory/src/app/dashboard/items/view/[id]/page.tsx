'use client'

import { useState, useEffect } from 'react'
import { Package, ArrowLeft, Edit, Calendar, DollarSign, Box, Tag, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ViewItemPage() {
  const params = useParams()
  // FIX: Add optional chaining for Next.js 14
  const itemId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('🔍 View Page - Params:', params)
    console.log('🔍 View Page - Item ID:', itemId)
    
    if (itemId) {
      fetchItem()
    } else {
      console.log(' View Page - No item ID found')
      setError('Item ID is missing')
      setLoading(false)
    }
  }, [itemId])

  const fetchItem = async () => {
    try {
      setLoading(true)
      console.log(`🔍 Fetching item: ${itemId}`)
      console.log(`🔍 API URL: /api/items/${itemId}`)
      
      const response = await fetch(`/api/items/${itemId}`)
      console.log('🔍 Response status:', response.status)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch item'
        try {
          const errorData = await response.json()
          console.log('🔍 Error data:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.log('🔍 Could not parse error JSON')
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log(' Item data received:', data)
      
      setItem(data)
      
    } catch (err: any) {
      console.error(' Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading item details...</p>
          <p className="text-sm text-gray-500">ID: {itemId}</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/dashboard/items" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Items
        </Link>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700 font-medium">Error: {error || 'Item not found'}</p>
          <p className="text-red-600 text-sm mt-1">Item ID: {itemId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link href="/dashboard/items" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-3 text-blue-600" />
            {item.name}
          </h1>
          <p className="text-gray-600">Item details and information</p>
        </div>
        
        <Link
          href={`/dashboard/items/edit/${itemId}`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Item
        </Link>
      </div>

      {/* Item Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Item Code */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Item Code</div>
              <div className="text-lg font-bold text-gray-900">{item.code}</div>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Box className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Category</div>
              <div className="text-lg font-bold text-gray-900">{item.category}</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-lg font-bold ${item.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Unit */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Box className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Unit of Measure</div>
              <div className="text-lg font-bold text-gray-900">{item.unitOfMeasure}</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Current Price</div>
              <div className="text-lg font-bold text-gray-900">
                RWF {item.currentPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Reorder Level */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Reorder Level</div>
              <div className="text-lg font-bold text-gray-900">{item.reorderLevel}</div>
            </div>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Stock</div>
              <div className={`text-lg font-bold ${
                (item.totalStockQuantity || 0) < item.reorderLevel 
                  ? 'text-red-600' 
                  : (item.totalStockQuantity || 0) === 0 
                    ? 'text-gray-400' 
                    : 'text-green-600'
              }`}>
                {item.totalStockQuantity || 0} {item.unitOfMeasure}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
        {item.description ? (
          <p className="text-gray-700">{item.description}</p>
        ) : (
          <p className="text-gray-500 italic">No description provided</p>
        )}
      </div>

      {/* Stock Balances by Branch */}
      {item.stockBalances && item.stockBalances.length > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock by Branch</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600">Branch</th>
                  <th className="text-left px-4 py-2 text-gray-600">Quantity</th>
                  <th className="text-left px-4 py-2 text-gray-600">Status</th>
                  <th className="text-left px-4 py-2 text-gray-600">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {item.stockBalances.map((balance: any) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{balance.branch?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{balance.branch?.code || ''}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className={`font-semibold ${
                        balance.quantity < item.reorderLevel 
                          ? 'text-red-600' 
                          : balance.quantity === 0 
                            ? 'text-gray-400' 
                            : 'text-green-600'
                      }`}>
                        {balance.quantity} {item.unitOfMeasure}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {balance.quantity < item.reorderLevel ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Low Stock</span>
                      ) : balance.quantity === 0 ? (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Out of Stock</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">In Stock</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(balance.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Created Date</div>
              <div className="text-gray-900">
                {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-gray-900">
                {new Date(item.updatedAt).toLocaleDateString()} at {new Date(item.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}