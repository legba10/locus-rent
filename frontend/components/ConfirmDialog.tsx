'use client'

import { AlertTriangle, X } from 'lucide-react'
import { create } from 'zustand'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
  variant: 'danger' | 'warning' | 'info'
}

interface ConfirmDialogStore {
  dialog: ConfirmDialogState
  show: (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel?: () => void
    variant?: 'danger' | 'warning' | 'info'
  }) => void
  hide: () => void
}

const defaultState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  onConfirm: null,
  onCancel: null,
  variant: 'info',
}

export const useConfirmDialog = create<ConfirmDialogStore>((set) => ({
  dialog: defaultState,
  show: (options) => {
    set({
      dialog: {
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel || null,
        variant: options.variant || 'info',
      },
    })
  },
  hide: () => {
    set({ dialog: defaultState })
  },
}))

export default function ConfirmDialog() {
  const { dialog, hide } = useConfirmDialog()

  if (!dialog.isOpen) return null

  const handleConfirm = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm()
    }
    hide()
  }

  const handleCancel = () => {
    if (dialog.onCancel) {
      dialog.onCancel()
    }
    hide()
  }

  const variantColors = {
    danger: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-primary hover:bg-primary-dark',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-xl border-2 max-w-md w-full ${variantColors[dialog.variant]}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{dialog.title}</h3>
              <p className="text-sm">{dialog.message}</p>
            </div>
            <button
              onClick={handleCancel}
              className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-white border border-current rounded-lg hover:bg-opacity-20 transition-colors font-medium"
            >
              {dialog.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 ${buttonColors[dialog.variant]} text-white rounded-lg transition-colors font-medium`}
            >
              {dialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
