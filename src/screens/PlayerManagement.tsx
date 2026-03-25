import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Activity, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../helpers/supabase'

interface Player {
  id: string
  full_name: string
  position: string
  jersey_number: number
  attendance_rate: number
  fitness_score: number
  goals: number
  assists: number
  injuries: string[]
  is_available: boolean
  ai_rating: number
}

export default function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    position: 'Striker',
    jersey_number: '',
    fitness_score: 80,
    attendance_rate: 100,
  })

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*').order('jersey_number')
    setPlayers(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const playerData = {
      ...formData,
      jersey_number: parseInt(formData.jersey_number),
      ai_rating: calculateAIRating(formData.fitness_score, formData.attendance_rate),
      is_available: true,
      injuries: [],
      goals: 0,
      assists: 0,
    }

    if (editingPlayer) {
      await supabase.from('players').update(playerData).eq('id', editingPlayer.id)
    } else {
      await supabase.from('players').insert(playerData)
    }

    setLoading(false)
    setShowAddModal(false)
    setEditingPlayer(null)
    resetForm()
    fetchPlayers()
  }

  const calculateAIRating = (fitness: number, attendance: number) => {
    return ((fitness * 0.6) + (attendance * 0.4)) / 10
  }

  const deletePlayer = async (id: string) => {
    if (confirm('Delete this player?')) {
      await supabase.from('players').delete().eq('id', id)
      fetchPlayers()
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      position: 'Striker',
      jersey_number: '',
      fitness_score: 80,
      attendance_rate: 100,
    })
  }

  const getPositionColor = (pos: string) => {
    const colors: Record<string, string> = {
      'Striker': 'bg-red-500',
      'Midfielder': 'bg-blue-500',
      'Defender': 'bg-green-500',
      'Goalkeeper': 'bg-yellow-500',
    }
    return colors[pos] || 'bg-gray-500'
  }

  const getFitnessColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Player Management</h1>
            <p className="text-gray-400 mt-1">Manage squad, track fitness & generate AI lineups</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blood-500 hover:bg-blood-600 rounded-xl text-white font-bold transition-colors"
          >
            <Plus size={20} /> Add Player
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#161b22] border border-blood-700/30 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Total Players</p>
            <p className="text-3xl font-bold text-white">{players.length}</p>
          </div>
          <div className="bg-[#161b22] border border-blood-700/30 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Available</p>
            <p className="text-3xl font-bold text-green-400">
              {players.filter(p => p.is_available).length}
            </p>
          </div>
          <div className="bg-[#161b22] border border-blood-700/30 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Injured</p>
            <p className="text-3xl font-bold text-red-400">
              {players.filter(p => p.injuries?.length > 0).length}
            </p>
          </div>
          <div className="bg-[#161b22] border border-blood-700/30 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Avg Fitness</p>
            <p className="text-3xl font-bold text-blood-500">
              {players.length ? Math.round(players.reduce((a, p) => a + p.fitness_score, 0) / players.length) : 0}%
            </p>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161b22] border border-blood-700/30 rounded-xl p-6 hover:border-blood-500 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${getPositionColor(player.position)} flex items-center justify-center text-2xl font-bold text-white`}>
                    {player.jersey_number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{player.full_name}</h3>
                    <span className="text-sm text-gray-400">{player.position}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingPlayer(player); setFormData(player as any); setShowAddModal(true) }}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Activity size={14} /> Fitness
                  </span>
                  <span className={`font-bold ${getFitnessColor(player.fitness_score)}`}>
                    {player.fitness_score}%
                  </span>
                </div>
                <div className="w-full bg-[#0d1117] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${player.fitness_score >= 80 ? 'bg-green-500' : player.fitness_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${player.fitness_score}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Calendar size={14} /> Attendance
                  </span>
                  <span className="text-white font-bold">{player.attendance_rate}%</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-blood-700/30">
                  <span className="text-gray-400 text-sm">AI Rating</span>
                  <span className="text-gold-400 font-bold text-lg">{player.ai_rating?.toFixed(1) || '0.0'}</span>
                </div>

                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">Goals: <span className="text-white font-bold">{player.goals}</span></span>
                  <span className="text-gray-400">Assists: <span className="text-white font-bold">{player.assists}</span></span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {player.is_available ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <AlertCircle size={14} /> Unavailable
                    </span>
                  )}
                  {player.injuries?.length > 0 && (
                    <span className="text-red-400 text-sm">({player.injuries.length} injuries)</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-[#161b22] border border-blood-700/50 rounded-2xl p-8 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-blood-700/50 rounded-lg px-4 py-3 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-[#0d1117] border border-blood-700/50 rounded-lg px-4 py-3 text-white"
                  >
                    <option>Striker</option>
                    <option>Midfielder</option>
                    <option>Defender</option>
                    <option>Goalkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Jersey #</label>
                  <input
                    type="number"
                    value={formData.jersey_number}
                    onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                    className="w-full bg-[#0d1117] border border-blood-700/50 rounded-lg px-4 py-3 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fitness Score: {formData.fitness_score}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.fitness_score}
                  onChange={(e) => setFormData({ ...formData, fitness_score: parseInt(e.target.value) })}
                  className="w-full accent-blood-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Attendance Rate: {formData.attendance_rate}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.attendance_rate}
                  onChange={(e) => setFormData({ ...formData, attendance_rate: parseInt(e.target.value) })}
                  className="w-full accent-blood-500"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPlayer(null); resetForm() }}
                  className="flex-1 py-3 bg-[#21262d] text-white rounded-lg hover:bg-[#30363d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blood-500 text-white rounded-lg hover:bg-blood-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingPlayer ? 'Update' : 'Add Player')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}