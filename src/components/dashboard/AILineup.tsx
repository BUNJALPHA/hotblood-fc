import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, RefreshCw, Save, CheckCircle, Calendar, 
  TrendingUp, Activity, AlertCircle, ChevronDown, ChevronUp,
  Target, Award, Zap
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { format, subDays, differenceInDays } from 'date-fns'

interface Player {
  id: string
  full_name: string
  photo_url: string | null
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  jersey_number: number
  category: 'senior' | 'junior'
  fitness_status: 'fit' | 'injured' | 'suspended' | 'recovering'
  goals: number
  assists: number
  strengths: string[]
  weaknesses: string[]
}

interface AttendanceRecord {
  player_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  performance_rating: number
  type: 'practice' | 'match'
}

interface AIPlayer extends Player {
  attendance_rate: number
  avg_performance: number
  fitness_score: number
  form_trend: number
  ai_rating: number
  last_5_games: number[]
}

interface Formation {
  name: string
  positions: Record<string, number>
  description: string
}

const formations: Formation[] = [
  { name: '4-3-3', positions: { GK: 1, DEF: 4, MID: 3, FWD: 3 }, description: 'Attacking, wide play' },
  { name: '4-4-2', positions: { GK: 1, DEF: 4, MID: 4, FWD: 2 }, description: 'Balanced, traditional' },
  { name: '3-5-2', positions: { GK: 1, DEF: 3, MID: 5, FWD: 2 }, description: 'Midfield dominance' },
  { name: '4-2-3-1', positions: { GK: 1, DEF: 4, MID: 2, CAM: 3, FWD: 1 }, description: 'Modern, flexible' },
  { name: '5-3-2', positions: { GK: 1, DEF: 5, MID: 3, FWD: 2 }, description: 'Defensive, counter-attack' }
]

export default function AILineup() {
  const [players, setPlayers] = useState<AIPlayer[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [selectedFormation, setSelectedFormation] = useState('4-3-3')
  const [lineup, setLineup] = useState<AIPlayer[]>([])
  const [substitutes, setSubstitutes] = useState<AIPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<AIPlayer | null>(null)
  const [matchDate, setMatchDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<'senior' | 'junior'>('senior')

  useEffect(() => {
    fetchData()
  }, [category])

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
    
    // Fetch attendance (last 30 days)
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', thirtyDaysAgo)
    
    // Fetch match performances (last 5 matches)
    const { data: matchesData } = await supabase
      .from('matches')
      .select('first_11, our_score, opponent_score')
      .eq('status', 'completed')
      .order('match_date', { ascending: false })
      .limit(5)

    if (playersData) {
      const enhancedPlayers = playersData.map(player => {
        // Calculate attendance rate
        const playerAttendance = attendanceData?.filter(a => a.player_id === player.id) || []
        const presentCount = playerAttendance.filter(a => a.status === 'present').length
        const attendanceRate = playerAttendance.length > 0 
          ? (presentCount / playerAttendance.length) * 100 
          : 100

        // Calculate average performance rating
        const ratings = playerAttendance
          .filter(a => a.performance_rating)
          .map(a => a.performance_rating)
        const avgPerformance = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 7

        // Calculate fitness score (0-100)
        const fitnessScore = player.fitness_status === 'fit' ? 100 :
                            player.fitness_status === 'recovering' ? 75 :
                            player.fitness_status === 'injured' ? 0 :
                            player.fitness_status === 'suspended' ? 0 : 50

        // Calculate form trend (last 5 games contribution)
        const last5Games = matchesData?.map((match, idx) => {
          const wasInLineup = match.first_11?.includes(player.id)
          return wasInLineup ? (match.our_score || 0) - (match.opponent_score || 0) : 0
        }) || [0, 0, 0, 0, 0]

        const formTrend = last5Games.reduce((a, b) => a + b, 0) / 5

        // AI Rating calculation (weighted)
        const aiRating = (
          (attendanceRate * 0.35) +           // 35% attendance
          (avgPerformance * 10 * 0.25) +      // 25% performance (1-10 scale to 100)
          (fitnessScore * 0.25) +             // 25% fitness
          (Math.max(0, formTrend + 5) * 10 * 0.15) // 15% form trend (normalized)
        ) / 10 // Scale to 0-10

        return {
          ...player,
          attendance_rate: Math.round(attendanceRate),
          avg_performance: Math.round(avgPerformance * 10) / 10,
          fitness_score: fitnessScore,
          form_trend: Math.round(formTrend * 10) / 10,
          ai_rating: Math.round(aiRating * 10) / 10,
          last_5_games: last5Games
        }
      })

      setPlayers(enhancedPlayers)
      setAttendance(attendanceData || [])
    }
    
    setLoading(false)
  }

  const generateLineup = async () => {
    setGenerating(true)
    setSaved(false)
    
    const formation = formations.find(f => f.name === selectedFormation)!
    const availablePlayers = players.filter(p => 
      p.fitness_status === 'fit' && 
      p.attendance_rate >= 60 // Minimum 60% attendance
    )
    
    const newLineup: AIPlayer[] = []
    const usedIds = new Set()

    // Position mapping
    const positionMap: Record<string, string[]> = {
      GK: ['GK'],
      DEF: ['DEF'],
      MID: ['MID'],
      CAM: ['MID'],
      FWD: ['FWD']
    }

    // Select best player for each position
    Object.entries(formation.positions).forEach(([pos, count]) => {
      const validPositions = positionMap[pos] || []
      
      const candidates = availablePlayers
        .filter(p => validPositions.includes(p.position) && !usedIds.has(p.id))
        .sort((a, b) => b.ai_rating - a.ai_rating)
        .slice(0, count)
      
      candidates.forEach(player => {
        usedIds.add(player.id)
        newLineup.push(player)
      })
    })

    // Select substitutes (next best players not in lineup)
    const subs = availablePlayers
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => b.ai_rating - a.ai_rating)
      .slice(0, 7)

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLineup(newLineup)
    setSubstitutes(subs)
    setGenerating(false)
  }

  const saveLineup = async () => {
    // Find upcoming match
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'upcoming')
      .order('match_date', { ascending: true })
      .limit(1)
      .single()

    if (match) {
      await supabase.from('matches').update({
        first_11: lineup.map(p => p.id),
        substitutes: substitutes.map(p => p.id),
        ai_generated: true,
        ai_rating_avg: lineup.reduce((sum, p) => sum + p.ai_rating, 0) / lineup.length
      }).eq('id', match.id)
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const getFitnessColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 75) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-400'
    if (rating >= 6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2">
              AI <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">Lineup Generator</span>
            </h1>
            <p className="text-slate-400">Smart team selection based on attendance, fitness & performance</p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'senior' | 'junior')}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="senior">Senior Team</option>
              <option value="junior">Junior Team</option>
            </select>
            
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none"
            >
              {formations.map(f => (
                <option key={f.name} value={f.name}>{f.name} - {f.description}</option>
              ))}
            </select>

            <button
              onClick={generateLineup}
              disabled={generating || players.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white font-bold disabled:opacity-50 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Analyzing...' : 'Generate Lineup'}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-1">Available Players</p>
            <p className="text-2xl font-black text-white">{players.filter(p => p.fitness_status === 'fit').length}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-1">Avg Attendance</p>
            <p className="text-2xl font-black text-emerald-400">
              {players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.attendance_rate, 0) / players.length) : 0}%
            </p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-1">Avg AI Rating</p>
            <p className="text-2xl font-black text-orange-400">
              {lineup.length > 0 ? (lineup.reduce((sum, p) => sum + p.ai_rating, 0) / lineup.length).toFixed(1) : '-'}
            </p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-1">Team Chemistry</p>
            <p className="text-2xl font-black text-blue-400">
              {lineup.length > 0 ? Math.min(100, Math.round(lineup.reduce((sum, p) => sum + p.attendance_rate, 0) / lineup.length + 20)) : '-'}%
            </p>
          </div>
        </div>

        {lineup.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pitch Visualization */}
            <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-green-900/20" />
              
              {/* Football Pitch */}
              <div className="relative aspect-[1.5/1] bg-gradient-to-b from-emerald-800/40 to-emerald-900/40 rounded-lg border-2 border-white/20">
                {/* Center line */}
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
                
                {/* Players */}
                {lineup.map((player, idx) => {
                  const positions: Record<string, { x: number; y: number }[]> = {
                    GK: [{ x: 8, y: 50 }],
                    DEF: [{ x: 25, y: 15 }, { x: 25, y: 38 }, { x: 25, y: 62 }, { x: 25, y: 85 }],
                    MID: [{ x: 50, y: 20 }, { x: 50, y: 50 }, { x: 50, y: 80 }],
                    CAM: [{ x: 65, y: 25 }, { x: 65, y: 50 }, { x: 65, y: 75 }],
                    FWD: [{ x: 85, y: 30 }, { x: 85, y: 50 }, { x: 85, y: 70 }]
                  }
                  
                  const posType = player.position === 'GK' ? 'GK' : 
                                  player.position === 'DEF' ? 'DEF' : 
                                  player.position === 'MID' ? 'MID' : 'FWD'
                  
                  const posIndex = lineup.filter((p, i) => i < idx && p.position === player.position).length
                  const pos = positions[posType]?.[posIndex] || { x: 50, y: 50 }

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className="flex flex-col items-center group">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 border-2 border-white flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                            {player.jersey_number}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                            player.fitness_score >= 90 ? 'bg-emerald-500' :
                            player.fitness_score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <span className="mt-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded whitespace-nowrap backdrop-blur-sm">
                          {player.full_name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {player.ai_rating.toFixed(1)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setLineup([])}
                  className="px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={saveLineup}
                  disabled={saved}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  }`}
                >
                  {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                  {saved ? 'Saved!' : 'Save Lineup'}
                </button>
              </div>
            </div>

            {/* Player List & Details */}
            <div className="space-y-4">
              {/* Selected Player Details */}
              {selectedPlayer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {selectedPlayer.photo_url ? (
                      <img src={selectedPlayer.photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl font-bold text-white">
                        {selectedPlayer.jersey_number}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedPlayer.full_name}</h3>
                      <p className="text-slate-400">{selectedPlayer.position} • #{selectedPlayer.jersey_number}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Calendar size={16} /> Attendance
                      </span>
                      <span className={`font-bold ${getFitnessColor(selectedPlayer.attendance_rate)}`}>
                        {selectedPlayer.attendance_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${selectedPlayer.attendance_rate >= 90 ? 'bg-emerald-500' : selectedPlayer.attendance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${selectedPlayer.attendance_rate}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Activity size={16} /> Fitness
                      </span>
                      <span className={`font-bold ${getFitnessColor(selectedPlayer.fitness_score)}`}>
                        {selectedPlayer.fitness_score}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Target size={16} /> Avg Performance
                      </span>
                      <span className="font-bold text-white">{selectedPlayer.avg_performance}/10</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2">
                        <TrendingUp size={16} /> Form Trend
                      </span>
                      <span className={`font-bold ${selectedPlayer.form_trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedPlayer.form_trend > 0 ? '+' : ''}{selectedPlayer.form_trend}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Sparkles size={16} /> AI Rating
                      </span>
                      <span className={`text-2xl font-black ${getRatingColor(selectedPlayer.ai_rating)}`}>
                        {selectedPlayer.ai_rating.toFixed(1)}
                      </span>
                    </div>

                    {selectedPlayer.strengths.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-slate-400 mb-2">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlayer.strengths.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Lineup List */}
              <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="text-orange-500" /> Starting XI
                </h3>
                <div className="space-y-2">
                  {lineup.map((player, idx) => (
                    <div 
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <img 
                        src={player.photo_url || '/images/logo.png'} 
                        alt="" 
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{player.full_name}</p>
                        <p className="text-xs text-slate-400">{player.position}</p>
                      </div>
                      <span className={`font-bold ${getRatingColor(player.ai_rating)}`}>
                        {player.ai_rating.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Substitutes */}
              {substitutes.length > 0 && (
                <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="text-yellow-500" /> Substitutes
                  </h3>
                  <div className="space-y-2">
                    {substitutes.map((player) => (
                      <div 
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <img 
                          src={player.photo_url || '/images/logo.png'} 
                          alt="" 
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{player.full_name}</p>
                          <p className="text-xs text-slate-400">{player.position}</p>
                        </div>
                        <span className={`text-sm font-bold ${getRatingColor(player.ai_rating)}`}>
                          {player.ai_rating.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Generate Your First Lineup</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Click "Generate Lineup" to let AI analyze player data and suggest the optimal team formation based on attendance, fitness, and performance.
            </p>
            <button
              onClick={generateLineup}
              disabled={generating || players.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {generating ? 'Analyzing...' : 'Generate Lineup'}
            </button>
          </div>
        )}

        {/* Attendance Recording Section */}
        <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-orange-500" /> Record Attendance
              </h3>
              <p className="text-slate-400 text-sm mt-1">Track player attendance for AI analysis</p>
            </div>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {players.filter(p => p.fitness_status !== 'injured').map(player => {
              const todayAttendance = attendance.find(a => 
                a.player_id === player.id && 
                a.date === matchDate &&
                a.type === 'practice'
              )

              return (
                <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <img 
                    src={player.photo_url || '/images/logo.png'} 
                    alt="" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{player.full_name}</p>
                    <p className="text-xs text-slate-400">#{player.jersey_number}</p>
                  </div>
                  <select
                    value={todayAttendance?.status || ''}
                    onChange={async (e) => {
                      const status = e.target.value as any
                      if (todayAttendance) {
                        await supabase.from('attendance').update({ status }).eq('id', todayAttendance.id)
                      } else {
                        await supabase.from('attendance').insert({
                          player_id: player.id,
                          date: matchDate,
                          type: 'practice',
                          status,
                          recorded_by: (await supabase.auth.getUser()).data.user?.id
                        })
                      }
                      fetchData()
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                      todayAttendance?.status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      todayAttendance?.status === 'absent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      todayAttendance?.status === 'late' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                  >
                    <option value="">Mark</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}