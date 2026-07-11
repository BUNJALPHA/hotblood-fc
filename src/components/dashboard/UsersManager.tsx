// =============================================
// HOT BLOOD FC — Users Manager
// View, search, manage roles, flag suspicious accounts
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Search, Shield, User, Crown, Ban, CheckCircle, Calendar,
  Mail, Phone, AlertTriangle, X,
} from 'lucide-react'
import { fetchAll, updateRow } from '../../helpers/api'
import { useToast, Modal, Skeleton } from '../ui/Toast'
import { formatDate } from '../../helpers/api'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  nickname: string | null
  phone: string | null
  avatar_url: string | null
  favorite_player: string | null
  favorite_team: string | null
  role: 'super_admin' | 'admin' | 'fan'
  is_flagged: boolean
  flag_reason: string | null
  is_top_fan: boolean | null
  created_at: string
}

const ROLE_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  super_admin: { label: 'Super Admin', color: 'bg-yellow-500/20 text-yellow-400', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400', icon: Shield },
  fan: { label: 'Fan', color: 'bg-blue-500/20 text-blue-400', icon: User },
}

export default function UsersManager() {
  const { show } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Profile | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const data = await fetchAll<Profile>('profiles', {
      order: { column: 'created_at' },
    })
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const stats = useMemo(() => {
    return {
      total: users.length,
      fans: users.filter((u) => u.role === 'fan').length,
      admins: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
      flagged: users.filter((u) => u.is_flagged).length,
    }
  }, [users])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter === 'admins' && u.role !== 'admin' && u.role !== 'super_admin') return false
      if (filter === 'fans' && u.role !== 'fan') return false
      if (filter === 'flagged' && !u.is_flagged) return false
      const q = search.toLowerCase()
      return (
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.nickname || '').toLowerCase().includes(q)
      )
    })
  }, [users, search, filter])

  const handleRoleChange = async (user: Profile, newRole: 'fan' | 'admin') => {
    if (user.role === 'super_admin') {
      show('Cannot change Super Admin role', 'error')
      return
    }
    await updateRow('profiles', user.id, { role: newRole })
    show(`Role changed to ${newRole}`, 'success')
    fetchUsers()
    setSelected(null)
  }

  const handleToggleFlag = async (user: Profile) => {
    await updateRow('profiles', user.id, {
      is_flagged: !user.is_flagged,
      flag_reason: !user.is_flagged ? 'Flagged by admin' : null,
    })
    show(user.is_flagged ? 'User unflagged' : 'User flagged', 'success')
    fetchUsers()
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-1">
          User <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">Management</span>
        </h2>
        <p className="text-slate-400 text-sm">Manage registered fans, admins, and access</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'from-blue-500 to-cyan-600' },
          { label: 'Fans', value: stats.fans, icon: User, color: 'from-emerald-500 to-teal-600' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'from-purple-500 to-pink-600' },
          { label: 'Flagged', value: stats.flagged, icon: AlertTriangle, color: 'from-red-500 to-orange-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or nickname..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:border-orange-500/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'admins', 'fans', 'flagged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
                filter === f ? 'bg-orange-500 text-white' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
          <p className="text-slate-400">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((user, idx) => {
            const badge = ROLE_BADGE[user.role] || ROLE_BADGE.fan
            const RoleIcon = badge.icon
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-slate-800/40 backdrop-blur-xl border rounded-2xl p-4 flex items-center justify-between gap-3 transition-all hover:border-slate-600 ${
                  user.is_flagged ? 'border-red-500/40' : 'border-slate-700/50'
                }`}
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-white text-lg flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (user.full_name || user.nickname || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white truncate">{user.full_name || user.nickname || 'Unknown'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${badge.color}`}>
                        <RoleIcon className="w-3 h-3" /> {badge.label}
                      </span>
                      {user.is_flagged && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> FLAGGED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.email || 'No email'}</p>
                    <p className="text-xs text-slate-500">Joined {formatDate(user.created_at)}</p>
                  </div>
                </div>

                {/* View button */}
                <button
                  onClick={() => setSelected(user)}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-all flex-shrink-0"
                >
                  View
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* User Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="User Details" size="md">
        {selected && (
          <div className="space-y-5">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-white text-3xl overflow-hidden">
                {selected.avatar_url ? (
                  <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (selected.full_name || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white">{selected.full_name || 'Unknown'}</h3>
                {selected.nickname && <p className="text-sm text-slate-400">@{selected.nickname}</p>}
                <span className={`mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[selected.role].color}`}>
                  {ROLE_BADGE[selected.role].label}
                </span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-white truncate">{selected.email || 'Not set'}</p>
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm text-white">{selected.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="text-sm text-white">{formatDate(selected.created_at)}</p>
                </div>
              </div>
              {selected.favorite_player && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Favorite Player</p>
                    <p className="text-sm text-white">{selected.favorite_player}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Flag status */}
            {selected.is_flagged && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Account Flagged</p>
                  <p className="text-xs text-slate-400">{selected.flag_reason || 'No reason provided'}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-700/50">
              {/* Role controls - only for non-super_admins */}
              {selected.role !== 'super_admin' && (
                <>
                  {selected.role !== 'admin' ? (
                    <button
                      onClick={() => handleRoleChange(selected, 'admin')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-medium text-sm transition-all"
                    >
                      <Shield className="w-4 h-4" /> Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(selected, 'fan')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-medium text-sm transition-all"
                    >
                      <User className="w-4 h-4" /> Make Fan
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleFlag(selected)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
                      selected.is_flagged
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30'
                    }`}
                  >
                    {selected.is_flagged ? (
                      <><CheckCircle className="w-4 h-4" /> Unflag User</>
                    ) : (
                      <><Ban className="w-4 h-4" /> Flag User</>
                    )}
                  </button>
                </>
              )}
              {selected.role === 'super_admin' && (
                <p className="text-xs text-yellow-400 flex items-center gap-2 py-2.5">
                  <Crown className="w-4 h-4" /> Super Admin - protected account
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
