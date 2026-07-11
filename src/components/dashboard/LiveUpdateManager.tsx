// =============================================
// HOT BLOOD FC — Live Update Manager
// Admin posts real-time updates (goals, cards, subs, injuries, photos)
// that appear instantly on the fan portal via Supabase Realtime
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Goal, Flag, Activity, Repeat, Camera, X, Clock,
  Radio, Image as ImageIcon, ChevronDown,
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { fetchAll, insertRow, deleteRow, uploadFile } from '../../helpers/api'
import { useToast, Modal, Button } from '../ui/Toast'
import { subscribe } from '../../helpers/api'
import type { LiveUpdate, Match } from '../../types'

const UPDATE_TYPES = [
  { id: 'goal', label: 'Goal', icon: Goal, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { id: 'card', label: 'Card', icon: Flag, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { id: 'substitution', label: 'Substitution', icon: Repeat, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { id: 'injury', label: 'Injury', icon: Activity, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { id: 'photo', label: 'Photo', icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { id: 'text', label: 'Update', icon: Radio, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
] as const

const TEAM_SIDES = [
  { id: 'home', label: 'Hot Blood FC' },
  { id: 'away', label: 'Opponent' },
] as const

export default function LiveUpdateManager({ matchId }: { matchId: string }) {
  const { show } = useToast()
  const [updates, setUpdates] = useState<LiveUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    update_type: 'goal' as (typeof UPDATE_TYPES)[number]['id'],
    headline: '',
    description: '',
    minute: '',
    team_side: 'home' as 'home' | 'away',
    image_url: '' as string | null,
  })

  const fetchUpdates = useCallback(async () => {
    const data = await fetchAll<LiveUpdate>('live_updates', {
      eq: { match_id: matchId },
      order: { column: 'created_at' },
    })
    setUpdates(data)
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    fetchUpdates()
    // Realtime: refresh when new updates arrive
    const unsub = subscribe('live_updates', fetchUpdates, `match_id=eq.${matchId}`)
    return unsub
  }, [fetchUpdates, matchId])

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    const url = await uploadFile('live-updates', file)
    if (url) {
      setForm((f) => ({ ...f, image_url: url }))
      show('Photo uploaded', 'success')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.headline.trim()) {
      show('Headline is required', 'error')
      return
    }
    setSaving(true)
    const result = await insertRow<LiveUpdate>('live_updates', {
      match_id: matchId,
      update_type: form.update_type,
      headline: form.headline,
      description: form.description || null,
      minute: form.minute ? parseInt(form.minute) : null,
      team_side: form.team_side,
      image_url: form.image_url,
    })
    if (result) {
      show('Update posted live to fans', 'success')
      setModalOpen(false)
      setForm({
        update_type: 'goal',
        headline: '',
        description: '',
        minute: '',
        team_side: 'home',
        image_url: null,
      })
      setImagePreview(null)
      fetchUpdates()
    } else {
      show('Failed to post update', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this update?')) return
    const ok = await deleteRow('live_updates', id)
    if (ok) {
      show('Update deleted', 'success')
      fetchUpdates()
    }
  }

  const typeConfig = (type: string) => UPDATE_TYPES.find((t) => t.id === type) || UPDATE_TYPES[5]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            Live Match Updates
          </h3>
          <p className="text-sm text-slate-400">Posts appear instantly on fan portal</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={Plus} size="sm">
          Add Update
        </Button>
      </div>

      {/* Updates feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/20 border border-slate-700/50 rounded-2xl">
          <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No updates posted yet</p>
          <p className="text-slate-500 text-sm">Post the first update of the match</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {updates.map((update, idx) => {
              const cfg = typeConfig(update.update_type)
              const Icon = cfg.icon
              return (
                <motion.div
                  key={update.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase">{cfg.label}</span>
                      {update.minute != null && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" /> {update.minute}'
                        </span>
                      )}
                      {update.team_side && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
                          {update.team_side === 'home' ? 'Hot Blood' : 'Opponent'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-white">{update.headline}</p>
                    {update.description && (
                      <p className="text-sm text-slate-300 mt-1">{update.description}</p>
                    )}
                    {update.image_url && (
                      <img
                        src={update.image_url}
                        alt={update.headline}
                        className="mt-3 rounded-xl max-h-48 object-cover w-full"
                      />
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(update.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Post Live Update" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Update Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {UPDATE_TYPES.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, update_type: t.id })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      form.update_type === t.id
                        ? `${t.bg} ${t.border} ${t.color}`
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Team side */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
            <div className="flex gap-2">
              {TEAM_SIDES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, team_side: s.id })}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.team_side === s.id
                      ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minute */}
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-300 mb-2">Minute</label>
            <div className="relative">
              <input
                type="number"
                value={form.minute}
                onChange={(e) => setForm({ ...form, minute: e.target.value })}
                min="0"
                max="120"
                placeholder="45"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">'</span>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Headline *</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              required
              placeholder="e.g., GOAL! Captain Mike scores from 25 yards"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Additional details..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Image upload */}
          {(form.update_type === 'photo' || imagePreview) && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Photo</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500/50 flex items-center justify-center bg-slate-800/30 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setForm({ ...form, image_url: null })
                    }}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Post to Fans
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
