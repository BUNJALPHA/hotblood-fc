// =============================================
// HOT BLOOD FC — UI Primitives
// Toast (3-sec auto-dismiss), Modal, GlassCard, Button, Skeleton
// =============================================

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

// --- Toast System ---
type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const ToastContext = createContext<{ show: (message: string, type?: ToastType) => void }>({
  show: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    // 3 seconds then disappear
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <AlertCircle className="w-5 h-5 text-orange-400" />,
  }

  const bg = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-orange-500/10 border-orange-500/30',
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${bg[t.type]} shadow-lg`}
              >
                {icons[t.type]}
                <span className="text-sm font-medium text-white flex-1">{t.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// --- Glass Card ---
export function GlassCard({
  children,
  className = '',
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={`bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

// --- Button ---
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  icon?: any
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost: 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      )}
      {children}
    </button>
  )
}

// --- Modal ---
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#0f172a] border border-slate-700/50 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full ${sizes[size]} max-h-[92vh] overflow-auto`}
        >
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 border-b border-slate-800/50 bg-[#0f172a]/95 backdrop-blur-xl">
            <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// --- Skeleton Loader ---
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-800/50 rounded-xl animate-pulse ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}
