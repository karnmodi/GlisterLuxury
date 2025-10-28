'use client'

interface Product {
  productID: string
  productName: string
  quantitySold?: number
  revenue?: number
  views?: number
  wishlistCount?: number
}

interface TopProductsTableProps {
  products: Product[]
  type: 'selling' | 'viewed' | 'wishlisted'
}

export default function TopProductsTable({ products, type }: TopProductsTableProps) {
  const getColumns = () => {
    switch (type) {
      case 'selling':
        return ['Product', 'Quantity Sold', 'Revenue']
      case 'viewed':
        return ['Product', 'Views']
      case 'wishlisted':
        return ['Product', 'Wishlist Count']
      default:
        return ['Product']
    }
  }

  const getValue = (product: Product) => {
    switch (type) {
      case 'selling':
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {product.quantitySold || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              £{(product.revenue || 0).toFixed(2)}
            </td>
          </>
        )
      case 'viewed':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {product.views || 0}
          </td>
        )
      case 'wishlisted':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {product.wishlistCount || 0}
          </td>
        )
    }
  }

  const columns = getColumns()

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {columns.map((col) => (
                <th 
                  key={col} 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.productID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.productName}
                  </td>
                  {getValue(product)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

