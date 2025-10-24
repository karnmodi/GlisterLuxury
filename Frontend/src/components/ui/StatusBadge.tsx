import type { OrderStatus } from '@/types'

interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/50' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-900/20 text-blue-400 border-blue-500/50' },
  processing: { label: 'Processing', color: 'bg-purple-900/20 text-purple-400 border-purple-500/50' },
  shipped: { label: 'Shipped', color: 'bg-indigo-900/20 text-indigo-400 border-indigo-500/50' },
  delivered: { label: 'Delivered', color: 'bg-green-900/20 text-green-400 border-green-500/50' },
  refund_requested: { label: 'Refund Requested', color: 'bg-orange-900/20 text-orange-400 border-orange-500/50' },
  refund_processing: { label: 'Refund Processing', color: 'bg-orange-900/20 text-orange-400 border-orange-500/50' },
  refund_completed: { label: 'Refund Completed', color: 'bg-gray-900/20 text-gray-400 border-gray-500/50' },
  cancelled: { label: 'Cancelled', color: 'bg-red-900/20 text-red-400 border-red-500/50' },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wide ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  )
}

