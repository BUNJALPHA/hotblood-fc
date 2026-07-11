// =============================================
// HOT BLOOD FC — Notification Panel
// Bell icon with unread count, real-time updates
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, BellOff } from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { fetchAll, updateRow } from '../../helpers/api'
import { subscribe } from '../../helpers/api'
import type { Notification } from '../../types'

const TYPE_ICONS: Record<string, string> = {
  match_reminder: '⚽',
  new_news: '📰',
  ticket_confirmation: '🎟️',
  donation_received: '🎁',
  live_match: '🔴',
  general: '🔔',
}

export default function NotificationPanel({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const data = await fetchAll<Notification>('notifications', {
      eq: { user_id: userId },
      order: { column: 'created_at' },
      limit: 20,
    })
    setNotifications(data)
  }, [userId])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()
    const unsub = subscribe('notifications', fetchNotifications, `user_id=eq.${userId}`)
    return unsub
  }, [userId, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markRead = async (id: string) => {
    await updateRow('notifications', id, { is_read: true })
    fetchNotifications()
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    await Promise.all(unread.map((n) => updateRow('notifications', n.id, { is_read: true })))
    fetchNotifications()
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const mutedColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
  const cardBg = theme === 'dark' ? 'bg-slate-900' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-full transition-colors ${textColor} hover:bg-slate-100 dark:hover:bg-slate-800`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] ${cardBg} border ${borderColor} rounded-2xl shadow-2xl z-50 overflow-hidden`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
                <h3 className={`font-bold ${textColor}`}>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-10 ${mutedColor}`}>
                    <BellOff className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full flex gap-3 px-4 py-3 border-b ${borderColor} text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !n.is_read ? 'bg-orange-50 dark:bg-orange-500/5' : ''
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${textColor} truncate`}>{n.title}</p>
                        <p className={`text-xs ${mutedColor} line-clamp-2`}>{n.message}</p>
                        <p className={`text-[10px] ${mutedColor} mt-1`}>
                          {new Date(n.created_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
