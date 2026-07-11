// =============================================
// HOT BLOOD FC — Chat Panel
// Real-time fan chat via Supabase Realtime
// Channels: general, or per-match
// =============================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, Users, Hash } from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { fetchAll, insertRow, getCurrentUser } from '../../helpers/api'
import type { ChatMessage } from '../../types'
import { subscribe } from '../../helpers/api'

interface ChatMessage {
  id: string
  user_id: string
  user_name: string | null
  avatar_url?: string | null
  message: string
  channel: string | null
  created_at: string
}

export default function ChatPanel({ channel = 'general' }: { channel?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages((data as ChatMessage[]) || [])
  }, [channel])

  useEffect(() => {
    fetchMessages()
    getCurrentUser().then(({ profile }) => setUser(profile))

    // Realtime subscription
    const unsub = subscribe('chat_messages', fetchMessages, `channel=eq.${channel}`)

    // Presence for online count
    const room = supabase.channel(`chat_${channel}`, {
      config: { presence: { key: Math.random().toString() } },
    })
    room
      .on('presence', { event: 'sync' }, () => {
        const presenceState = room.presenceState()
        setOnlineCount(Object.keys(presenceState).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      unsub()
      supabase.removeChannel(room)
    }
  }, [channel, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return
    setSending(true)

    const result = await insertRow<ChatMessage>('chat_messages', {
      user_id: user.id,
      user_name: user.full_name || user.nickname || 'Fan',
      avatar_url: user.avatar_url || null,
      message: input.trim(),
      channel,
    })

    if (result) {
      setInput('')
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white text-sm">{channel}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = user && msg.user_id === user.id
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold ${
                    isMe ? 'bg-orange-500 text-white' : 'bg-slate-600 text-white'
                  }`}>
                    {msg.avatar_url ? (
                      <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (msg.user_name || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <span className="text-xs text-slate-400 mb-0.5 ml-1">{msg.user_name}</span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-sm'
                          : 'bg-slate-700 text-white rounded-tl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 ml-1">
                      {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-700/50 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!user || sending}
            maxLength={500}
            placeholder={user ? 'Type a message...' : 'Please log in to chat'}
            className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !user || sending}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/30 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
