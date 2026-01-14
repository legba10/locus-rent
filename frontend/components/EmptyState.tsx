'use client'

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md font-medium"
        >
          {action.label}
        </Link>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="ml-4 inline-block border border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  )
}
