import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Trophy, 
  Users, Save, AlertCircle, CheckCircle
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { Match, League, Player } from '../../types/matches';

interface MatchSchedulerProps {
  onBack: () => void;
  editMatch?: Match | null;
}

export default function MatchScheduler({ onBack, editMatch }: MatchSchedulerProps) {
  const [formData, setFormData] = useState({
    opponent: editMatch?.opponent || '',
    competition: editMatch?.competition || '',
    is_home: editMatch?.is_home ?? true,
    match_date: editMatch?.match_date || '',
    match_time: editMatch?.match_time || '',
    venue: editMatch?.venue || '',
    league_id: editMatch?.league_id || '',
    match_type: 'league' as const,
    reminder_hours: 24
  });

  const [leagues, setLeagues] = useState<League[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLeagues();
    fetchPlayers();
  }, []);

  const fetchLeagues = async () => {
    try {
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active');
      
      if (data) setLeagues(data as League[]);
    } catch (err) {
      console.error('Error fetching leagues:', err);
    }
  };

  const fetchPlayers = async () => {
    try {
      const { data } = await supabase
        .from('players')
        .select('id, name, position, jersey_number')
        .eq('status', 'active');
      
      if (data) setPlayers(data as Player[]);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const matchData = {
        ...formData,
        status: 'upcoming' as const,
        our_score: null,
        opponent_score: null,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editMatch?.id) {
        result = await supabase
          .from('matches')
          .update(matchData)
          .eq('id', editMatch.id);
      } else {
        result = await supabase
          .from('matches')
          .insert([{ ...matchData, created_at: new Date().toISOString() }])
          .select();
      }

      if (result.error) throw result.error;

      // Create attendance records for all players
      if (!editMatch?.id && result.data?.[0]?.id) {
        const matchId = result.data[0].id;
        const attendanceRecords = players.map(player => ({
          match_id: matchId,
          player_id: player.id,
          status: 'pending' as const
        }));

        await supabase.from('match_attendance').insert(attendanceRecords);
        await scheduleReminder(matchId, formData.reminder_hours);
      }

      setSuccess(editMatch ? 'Match updated successfully!' : 'Match scheduled successfully!');
      setTimeout(() => onBack(), 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminder = async (matchId: string, hoursBefore: number) => {
    const matchDateTime = new Date(`${formData.match_date}T${formData.match_time}`);
    const reminderTime = new Date(matchDateTime.getTime() - (hoursBefore * 60 * 60 * 1000));

    await supabase.from('notifications').insert({
      type: 'match_reminder',
      title: `Upcoming Match: Hot Blood FC vs ${formData.opponent}`,
      message: `Match starts in ${hoursBefore} hours at ${formData.venue || 'Home Ground'}`,
      recipient_type: 'all',
      match_id: matchId,
      scheduled_at: reminderTime.toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
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
              {editMatch ? 'Edit' : 'Schedule'} <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Match</span>
            </h1>
            <p className="text-slate-400">
              {editMatch ? 'Update match details' : 'Create a new match and notify players'}
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle className="w-5 h-5" />
            {success}
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Opponent & Competition */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Opponent Team
              </label>
              <input
                type="text"
                required
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                placeholder="Enter opponent team name"
              />
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Competition
              </label>
              <select
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              >
                <option value="">Select or enter competition</option>
                {leagues.map(league => (
                  <option key={league.id} value={league.name}>{league.name} ({league.season})</option>
                ))}
                <option value="Friendly">Friendly Match</option>
                <option value="Cup">Cup Competition</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Match Date
              </label>
              <input
                type="date"
                required
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Kick-off Time
              </label>
              <input
                type="time"
                required
                value={formData.match_time}
                onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Venue & Home/Away */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Venue
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_home: true, venue: 'Home Ground' })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    formData.is_home 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_home: false, venue: '' })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !formData.is_home 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  Away
                </button>
              </div>
            </div>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder={formData.is_home ? 'Home Ground' : 'Enter away venue'}
            />
          </div>

          {/* Reminder Settings */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <label className="block text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Player Reminder
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-slate-400">Send reminder</span>
              <select
                value={formData.reminder_hours}
                onChange={(e) => setFormData({ ...formData, reminder_hours: parseInt(e.target.value) })}
                className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>2 days</option>
              </select>
              <span className="text-slate-400">before kick-off</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold border border-slate-700 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {editMatch ? 'Update Match' : 'Schedule Match'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}