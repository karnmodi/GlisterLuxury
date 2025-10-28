import type { OrderStatus } from '@/types'

type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'partially_paid' | 'payment_failed' | 'payment_pending_confirmation' | 'refunded'

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus
  type?: 'order' | 'payment'
  size?: 'sm' | 'md' | 'lg'
}

const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  refund_requested: { label: 'Refund Requested', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  refund_processing: { label: 'Refund Processing', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  refund_completed: { label: 'Refund Completed', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300' },
  partially_paid: { label: 'Partially Paid', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  payment_failed: { label: 'Payment Failed', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  payment_pending_confirmation: { label: 'Pending Confirmation', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  refunded: { label: 'Refunded', color: 'bg-violet-100 text-violet-800 border-violet-300' },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function StatusBadge({ status, type = 'order', size = 'md' }: StatusBadgeProps) {
  const config = type === 'payment' 
    ? paymentStatusConfig[status as PaymentStatus] 
    : orderStatusConfig[status as OrderStatus]
  
  if (!config) {
    return null
  }
  
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wide ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  )
}

