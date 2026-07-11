// =============================================
// HOT BLOOD FC — Profile Page
// Edit profile, avatar upload, view card + tickets + donations
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Camera, Save, Ticket as TicketIcon,
  Heart, Calendar, Star, ImageIcon, Flag,
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { updateRow, uploadFile, fetchAll } from '../../helpers/api'
import { useToast, Button, Skeleton } from '../ui/Toast'
import { formatDate, formatKES } from '../../helpers/api'
import MembershipCard from './MembershipCard'
import type { Ticket, Donation } from '../../types'

export default function ProfilePage({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { show } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [section, setSection] = useState<'profile' | 'card' | 'tickets' | 'donations'>('profile')

  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    phone: '',
    email: '',
    favorite_player: '',
    favorite_team: 'Hot Blood FC',
    avatar_url: '',
  })

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      setProfile(prof)
      setForm({
        full_name: prof.full_name || '',
        nickname: prof.nickname || '',
        phone: prof.phone || '',
        email: prof.email || user.email || '',
        favorite_player: prof.favorite_player || '',
        favorite_team: prof.favorite_team || 'Hot Blood FC',
        avatar_url: prof.avatar_url || '',
      })
      setAvatarPreview(prof.avatar_url || null)

      // Fetch tickets and donations
      const [userTickets, userDonations] = await Promise.all([
        fetchAll<Ticket>('tickets', {
          eq: { buyer_id: user.id },
          order: { column: 'created_at' },
        }),
        fetchAll<Donation>('donations', {
          eq: { user_id: user.id },
          order: { column: 'created_at' },
        }),
      ])
      setTickets(userTickets)
      setDonations(userDonations)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    const url = await uploadFile('profile-photos', file)
    if (url) {
      setForm((f) => ({ ...f, avatar_url: url }))
      show('Photo uploaded', 'success')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const result = await updateRow('profiles', profile.id, {
      full_name: form.full_name,
      nickname: form.nickname,
      phone: form.phone,
      email: form.email,
      favorite_player: form.favorite_player,
      favorite_team: form.favorite_team,
      avatar_url: form.avatar_url,
    })
    if (result) {
      setProfile(result)
      show('Profile updated successfully', 'success')
    } else {
      show('Failed to update profile', 'error')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const sections = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'card', label: 'Membership Card', icon: Star },
    { id: 'tickets', label: 'My Tickets', icon: TicketIcon },
    { id: 'donations', label: 'My Donations', icon: Heart },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                (form.full_name || '?').charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{form.full_name || 'Fan'}</h2>
            {form.nickname && <p className="text-slate-500">@{form.nickname}</p>}
            <p className="text-xs text-slate-400 mt-1">Member since {formatDate(profile?.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                section === s.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {s.label}
              {s.id === 'tickets' && tickets.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{tickets.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Profile edit */}
      {section === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <label className="cursor-pointer">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-500 flex items-center justify-center bg-slate-50 transition-colors overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </label>
              <div>
                <p className="font-semibold text-slate-800">Profile Photo</p>
                <p className="text-sm text-slate-500">Click to upload. Visible to admins.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nickname</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="CaptainFan99"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="254712345678"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Favorite Player</label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.favorite_player}
                    onChange={(e) => setForm({ ...form, favorite_player: e.target.value })}
                    placeholder="Captain Mike"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Favorite Team</label>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.favorite_team}
                    onChange={(e) => setForm({ ...form, favorite_team: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={saving} icon={Save} size="lg" className="w-full sm:w-auto">
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Membership card */}
      {section === 'card' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
        >
          <MembershipCard profile={profile} />
        </motion.div>
      )}

      {/* Tickets */}
      {section === 'tickets' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">My Tickets</h3>
          {tickets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <TicketIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No tickets purchased yet</p>
              {onNavigate && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => onNavigate('tickets')}>
                  Browse Tickets
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-500">{t.quantity} ticket{t.quantity > 1 ? 's' : ''}</span>
                  </div>
                  <p className="font-bold text-slate-900">Code: {t.ticket_code}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Valid until {formatDate(t.valid_until)}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{formatKES(t.total_price || t.price)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Donations */}
      {section === 'donations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">My Donations</h3>
          {donations.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No donations yet</p>
              {onNavigate && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => onNavigate('donate')}>
                  Support the Team
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {donations.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800">{formatKES(d.amount)}</p>
                    <p className="text-xs text-slate-500">{formatDate(d.created_at)}</p>
                    {d.message && <p className="text-xs text-slate-400 italic mt-0.5">"{d.message}"</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    d.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
