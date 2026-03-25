import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, CheckCircle, XCircle, AlertCircle,
  Activity, Calendar, Clock
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { Match, Player, AttendanceRecord } from '../../types/matches';

interface PlayerAttendanceProps {
  match: Match;
  onBack: () => void;
}

interface PlayerWithStats extends Player {
  attendance?: AttendanceRecord;
}

interface AIAnalysis {
  startingXI: Player[];
  substitutes: Player[];
  unavailable: Player[];
  stats: {
    total: number;
    confirmed: number;
    injured: number;
    declined: number;
    pending: number;
  };
  recommendation: string;
}

export default function PlayerAttendance({ match, onBack }: PlayerAttendanceProps) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch players
      const { data: playersData } = await supabase
        .from('players')
        .select('id, name, jersey_number, position, avatar_url')
        .eq('status', 'active');

      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from('match_attendance')
        .select('*')
        .eq('match_id', match.id);

      if (playersData) {
        const attendanceMap: Record<string, AttendanceRecord> = {};
        (attendanceData as AttendanceRecord[] || []).forEach((record) => {
          attendanceMap[record.player_id] = record;
        });

        setPlayers((playersData as Player[]).map(p => ({
          ...p,
          attendance: attendanceMap[p.id]
        })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [match.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateAttendance = async (playerId: string, status: AttendanceRecord['status']) => {
    const existing = players.find(p => p.id === playerId)?.attendance;

    try {
      if (existing?.id) {
        await supabase
          .from('match_attendance')
          .update({ status, confirmed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('match_attendance')
          .insert({
            match_id: match.id,
            player_id: playerId,
            status,
            confirmed_at: new Date().toISOString()
          });
      }

      setPlayers(prev => prev.map(p => 
        p.id === playerId 
          ? { ...p, attendance: { ...p.attendance, player_id: playerId, status, confirmed_at: new Date().toISOString() } as AttendanceRecord }
          : p
      ));
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };

  const generateAIAnalysis = async () => {
    const confirmed = players.filter(p => p.attendance?.status === 'confirmed');
    const injured = players.filter(p => p.attendance?.status === 'injured');
    const declined = players.filter(p => p.attendance?.status === 'declined');

    // Fetch historical performance data
    const { data: historyData } = await supabase
      .from('match_attendance')
      .select('player_id, status')
      .in('player_id', confirmed.map(p => p.id))
      .eq('status', 'confirmed');

    const attendanceCounts: Record<string, number> = {};
    (historyData as Array<{ player_id: string }> || []).forEach((record) => {
      attendanceCounts[record.player_id] = (attendanceCounts[record.player_id] || 0) + 1;
    });

    // Sort by attendance (most reliable first)
    const sortedConfirmed = [...confirmed].sort((a, b) => 
      (attendanceCounts[b.id] || 0) - (attendanceCounts[a.id] || 0)
    );

    // Generate starting XI (first 11 most reliable)
    const startingXI = sortedConfirmed.slice(0, 11);
    const substitutes = sortedConfirmed.slice(11);

    setAiAnalysis({
      startingXI,
      substitutes,
      unavailable: [...injured, ...declined],
      stats: {
        total: players.length,
        confirmed: confirmed.length,
        injured: injured.length,
        declined: declined.length,
        pending: players.length - confirmed.length - injured.length - declined.length
      },
      recommendation: confirmed.length >= 11 
        ? 'Sufficient players available. Starting XI generated based on attendance history.'
        : `Warning: Only ${confirmed.length} players confirmed. Need ${11 - confirmed.length} more for full squad.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'declined': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'injured': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      default: return 'bg-slate-700/50 border-slate-600 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black">
              Player <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Attendance</span>
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              vs {match.opponent} • {new Date(match.match_date).toLocaleDateString()} at {match.match_time}
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange-500" />
                  Squad Availability
                </h2>
                <button
                  onClick={generateAIAnalysis}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Activity className="w-4 h-4" />
                  Generate AI Analysis
                </button>
              </div>

              <div className="grid gap-3">
                {players.map((player, index) => {
                  const status = player.attendance?.status || 'pending';

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            player.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{player.name}</p>
                          <p className="text-sm text-slate-400">#{player.jersey_number} • {player.position}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(['confirmed', 'injured', 'declined'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateAttendance(player.id, s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                              status === s 
                                ? getStatusColor(s)
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="space-y-6">
              {aiAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    AI Analysis
                  </h3>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{aiAnalysis.stats.confirmed}</p>
                      <p className="text-xs text-slate-400">Confirmed</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{aiAnalysis.stats.injured}</p>
                      <p className="text-xs text-slate-400">Injured</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-400">{aiAnalysis.stats.declined}</p>
                      <p className="text-xs text-slate-400">Declined</p>
                    </div>
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-slate-400">{aiAnalysis.stats.pending}</p>
                      <p className="text-xs text-slate-400">Pending</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`p-4 rounded-xl mb-6 ${
                    aiAnalysis.stats.confirmed >= 11 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}>
                    <p className={`text-sm ${
                      aiAnalysis.stats.confirmed >= 11 ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      {aiAnalysis.recommendation}
                    </p>
                  </div>

                  {/* Starting XI */}
                  {aiAnalysis.startingXI.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Starting XI ({aiAnalysis.startingXI.length})
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.startingXI.map((player, idx) => (
                          <div key={player.id} className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 w-6">{idx + 1}.</span>
                            <span className="font-medium">{player.name}</span>
                            <span className="text-slate-500">#{player.jersey_number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Substitutes */}
                  {aiAnalysis.substitutes.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        Substitutes ({aiAnalysis.substitutes.length})
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.substitutes.map((player) => (
                          <div key={player.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-slate-500">#{player.jersey_number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 text-center">
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Click &quot;Generate AI Analysis&quot; to see recommendations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}